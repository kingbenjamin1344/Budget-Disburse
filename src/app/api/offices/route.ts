import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// 📍 GET: Fetch all offices
export async function GET() {
  const offices = await prisma.office.findMany({
    orderBy: { id: "desc" },
  });
  return NextResponse.json(offices);
}

// 📍 POST: Create a new office
export async function POST(request: Request) {
  const data = await request.json();
  const { name } = data;

  if (!name) {
    return NextResponse.json({ error: "Office name is required" }, { status: 400 });
  }

  const office = await prisma.office.create({
    data: { name },
  });

  return NextResponse.json(office);
}

// 📍 PUT: Update an office
export async function PUT(request: Request) {
  const data = await request.json();
  const { id, name } = data;

  if (!id || !name) {
    return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
  }

  try {
    const updatedOffice = await prisma.office.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(updatedOffice);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
  }
}

// 📍 DELETE: Delete an office
export async function DELETE(request: Request) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Office ID is required" }, { status: 400 });
  }

  await prisma.office.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Office deleted successfully" });
}
