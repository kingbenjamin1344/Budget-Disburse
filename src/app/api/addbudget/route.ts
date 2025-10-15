import { NextResponse } from "next/server";

// temporary in-memory storage (replace with database later)
let budgets: any[] = [];

export async function GET() {
  // Return all budgets
  return NextResponse.json(budgets);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { office, ps, mooe, co, total, dateCreated } = body;

    if (!office) {
      return NextResponse.json({ error: "Office is required" }, { status: 400 });
    }

    const newBudget = {
      id: Date.now(),
      office,
      ps,
      mooe,
      co,
      total,
      dateCreated,
    };

    budgets.unshift(newBudget);
    return NextResponse.json({ message: "Budget added successfully", data: newBudget });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add budget" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, office, ps, mooe, co, total, dateCreated } = body;

    const index = budgets.findIndex((b) => b.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    budgets[index] = { id, office, ps, mooe, co, total, dateCreated };
    return NextResponse.json({ message: "Budget updated", data: budgets[index] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    budgets = budgets.filter((b) => b.id !== id);
    return NextResponse.json({ message: "Budget deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
