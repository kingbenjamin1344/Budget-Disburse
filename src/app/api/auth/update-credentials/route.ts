import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { getUserNameFromRequest } from "@/lib/auth";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "f77737058b7cda6894c2b8552d18e26722398fcfc8ea7adddf8f6f5e9ec6a698";

const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const currentUsername = getUserNameFromRequest(request);
    if (!currentUsername) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newUsername, newPassword } = body;

    // Validate input
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required" },
        { status: 400 }
      );
    }

    // Get current user from database
    let user;
    try {
      user = await prisma.useradmin.findUnique({
        where: { username: currentUsername },
      });
    } catch (dbError) {
      console.error("Database query error:", dbError);
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    let passwordMatches = false;
    try {
      passwordMatches = await bcrypt.compare(currentPassword, user.password);
    } catch (e) {
      passwordMatches = false;
    }

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update username if provided and different
    if (newUsername && newUsername !== currentUsername) {
      // Check if new username already exists
      const existingUser = await prisma.useradmin.findUnique({
        where: { username: newUsername },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 400 }
        );
      }

      updateData.username = newUsername;
    }

    // Update password if provided
    if (newPassword && newPassword.length >= 6) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // Update user in database
    try {
      const updatedUser = await prisma.useradmin.update({
        where: { id: user.id },
        data: updateData,
      });

      // If username changed, issue new JWT token
      let response;
      if (newUsername && newUsername !== currentUsername) {
        const newToken = jwt.sign(
          { user: updatedUser.username },
          AUTH_SECRET,
          { expiresIn: TOKEN_EXPIRY_SECONDS }
        );

        response = NextResponse.json(
          {
            success: true,
            message: "Account updated successfully",
            usernameChanged: true,
          },
          { status: 200 }
        );

        response.cookies.set("auth-token", newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: TOKEN_EXPIRY_SECONDS,
        });
      } else {
        response = NextResponse.json(
          {
            success: true,
            message: "Account updated successfully",
            usernameChanged: false,
          },
          { status: 200 }
        );
      }

      return response;
    } catch (dbError) {
      console.error("Database update error:", dbError);
      return NextResponse.json(
        { error: "Failed to update account" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Update credentials error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
