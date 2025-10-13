// src/app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { dateCreated: "desc" } });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET /expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, category } = await request.json();
    if (!type || !category) {
      return NextResponse.json({ error: "Type and Category are required" }, { status: 400 });
    }

    const expense = await prisma.expense.create({ data: { type, category } });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("POST /expenses error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, type, category } = await request.json();
    if (!id || !type || !category) {
      return NextResponse.json({ error: "id, type and category are required" }, { status: 400 });
    }

    const existing = await prisma.expense.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const updated = await prisma.expense.update({
      where: { id: Number(id) },
      data: { type, category },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /expenses error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.expense.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /expenses error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
