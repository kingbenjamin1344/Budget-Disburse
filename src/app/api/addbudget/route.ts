import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import logAction from "../../../lib/log";
import { getUserNameFromRequest } from "../../../lib/auth";


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
      office: b.officeName || b.office?.name || "Unknown", // ✅ safer access
      ps: b.ps,
      mooe: b.mooe,
      co: b.co,
      total: b.total,
      dateCreated: b.dateCreated.toLocaleDateString(),
    }));

    // Add cache headers - revalidate every 60 seconds for fresh data
    return NextResponse.json(formatted, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error("GET /addbudget error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets", details: String(error) }, 
      { status: 500 }
    );
  }
}

// POST new budget
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { office, ps, mooe, co, total } = body;

    if (!office || ps === undefined || mooe === undefined || co === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: office, ps, mooe, co" }, 
        { status: 400 }
      );
    }

    // Find office by name
    const existingOffice = await prisma.office.findFirst({
      where: { name: office },
    });

    if (!existingOffice) {
      console.warn(`Office not found: "${office}". Available offices:`, await prisma.office.findMany());
      return NextResponse.json(
        { error: `Office not found: "${office}"` }, 
        { status: 400 }
      );
    }

    // Create budget with both officeId and officeName
    const newBudget = await prisma.budget.create({
      data: {
        officeId: existingOffice.id,
        officeName: existingOffice.name,
        ps: parseFloat(String(ps)),
        mooe: parseFloat(String(mooe)),
        co: parseFloat(String(co)),
        total: parseFloat(String(total)) || (parseFloat(String(ps)) + parseFloat(String(mooe)) + parseFloat(String(co))),
      },
      include: { office: true },
    });

    const actor = getUserNameFromRequest(req);
    await logAction({
      message: `id=${newBudget.id}, office="${newBudget.officeName}", PS=${newBudget.ps}, MOOE=${newBudget.mooe}, CO=${newBudget.co}, total=${newBudget.total}`,
      type: "Budget",
      action: "create",
      performedBy: actor || undefined,
    });

    return NextResponse.json({
      message: "Budget added successfully",
      id: newBudget.id,
      office: newBudget.officeName,
      ps: newBudget.ps,
      mooe: newBudget.mooe,
      co: newBudget.co,
      total: newBudget.total,
      dateCreated: newBudget.dateCreated.toLocaleDateString(),
    });
  } catch (error) {
    console.error("POST /addbudget error:", error);
    return NextResponse.json(
      { error: "Failed to add budget", details: String(error) }, 
      { status: 500 }
    );
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
    const existing = await prisma.budget.findUnique({ where: { id } });
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

    const actor = getUserNameFromRequest(req);
    await logAction({
      message: `id=${updated.id}: office "${existing?.officeName || "<unknown>"}" -> "${updated.officeName}", PS ${existing?.ps} -> ${updated.ps}, MOOE ${existing?.mooe} -> ${updated.mooe}, CO ${existing?.co} -> ${updated.co}, total ${existing?.total} -> ${updated.total}`,
      type: "Budget",
      action: "update",
      performedBy: actor || undefined,
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

    const existingBudget = await prisma.budget.findUnique({ where: { id } });
    await prisma.budget.delete({ where: { id } });
    const actor = getUserNameFromRequest(req);
    await logAction({
      message: `id=${id}, office="${existingBudget?.officeName || "<unknown>"}", PS=${existingBudget?.ps}, MOOE=${existingBudget?.mooe}, CO=${existingBudget?.co}, total=${existingBudget?.total}`,
      type: "Budget",
      action: "delete",
      performedBy: actor || undefined,
    });

    return NextResponse.json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("DELETE /addbudget error:", error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
