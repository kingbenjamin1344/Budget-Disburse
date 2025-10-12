import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * GET: Fetch all expenses
 */
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET /expenses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new expense
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, category } = body;

    if (!type || !category) {
      return NextResponse.json(
        { error: "Type and Category are required" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: { type, category },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("POST /expenses error:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update an existing expense
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, type, category } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      );
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: Number(id) }, // Prisma expects a number
      data: {
        ...(type && { type }),
        ...(category && { category }),
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error: any) {
    console.error("PUT /expenses error:", error.message);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete an expense
 */
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID required" },
        { status: 400 }
      );
    }

    await prisma.expense.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("DELETE /expenses error:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
