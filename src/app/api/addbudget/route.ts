import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all budgets (with office name)
export async function GET() {
  try {
    const budgets = await prisma.budget.findMany({
      include: { office: true },
      orderBy: { id: "desc" },
    });

    // Format for frontend
    const formatted = budgets.map((b) => ({
      id: b.id,
      office: b.officeName || b.office.name, // ✅ prefer stored officeName
      ps: b.ps,
      mooe: b.mooe,
      co: b.co,
      total: b.total,
      dateCreated: b.dateCreated.toLocaleDateString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /addbudget error:", error);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

// POST new budget
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { office, ps, mooe, co, total } = body;

    // Find office by name
    const existingOffice = await prisma.office.findFirst({
      where: { name: office },
    });

    if (!existingOffice) {
      return NextResponse.json({ error: "Office not found" }, { status: 400 });
    }

    // Create budget with both officeId and officeName
    const newBudget = await prisma.budget.create({
      data: {
        officeId: existingOffice.id,
        officeName: existingOffice.name, // ✅ store readable name
        ps,
        mooe,
        co,
        total,
      },
      include: { office: true },
    });

    return NextResponse.json({
      message: "Budget added successfully",
      data: {
        id: newBudget.id,
        office: newBudget.officeName,
        ps: newBudget.ps,
        mooe: newBudget.mooe,
        co: newBudget.co,
        total: newBudget.total,
        dateCreated: newBudget.dateCreated.toLocaleDateString(),
      },
    });
  } catch (error) {
    console.error("POST /addbudget error:", error);
    return NextResponse.json({ error: "Failed to add budget" }, { status: 500 });
  }
}

// PUT update budget
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, office, ps, mooe, co, total } = body;

    const existingOffice = await prisma.office.findFirst({
      where: { name: office },
    });

    if (!existingOffice) {
      return NextResponse.json({ error: "Office not found" }, { status: 400 });
    }

    // Update both fields so officeName stays in sync
    const updated = await prisma.budget.update({
      where: { id },
      data: {
        officeId: existingOffice.id,
        officeName: existingOffice.name, // ✅ keep name synced
        ps,
        mooe,
        co,
        total,
      },
      include: { office: true },
    });

    return NextResponse.json({
      message: "Budget updated successfully",
      data: {
        id: updated.id,
        office: updated.officeName,
        ps: updated.ps,
        mooe: updated.mooe,
        co: updated.co,
        total: updated.total,
        dateCreated: updated.dateCreated.toLocaleDateString(),
      },
    });
  } catch (error) {
    console.error("PUT /addbudget error:", error);
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

// DELETE budget
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("DELETE /addbudget error:", error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
