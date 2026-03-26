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
      office: b.office?.name || "Unknown",
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

    // Find office by name, or create it if it doesn't exist
    let existingOffice = await prisma.office.findFirst({
      where: { name: office },
    });

    console.log(`[POST /addbudget] Looking for office "${office}"...`);

    if (!existingOffice) {
      console.warn(`Office not found: "${office}". Auto-creating...`);
      try {
        existingOffice = await prisma.office.create({
          data: { name: office },
        });
        console.log(`✅ Office created: "${office}" with ID ${existingOffice.id}`);
      } catch (err: any) {
        // If create fails (e.g., unique constraint), try to find it again
        if (err.code === 'P2002') {
          console.log(`Office create failed with P2002 (unique constraint), retrying find...`);
          existingOffice = await prisma.office.findFirst({
            where: { name: office },
          });
          if (!existingOffice) {
            return NextResponse.json(
              { error: `Failed to create or find office: "${office}"` },
              { status: 500 }
            );
          }
        } else {
          throw err;
        }
      }
    } else {
      console.log(`✅ Office found: "${office}" with ID ${existingOffice.id}`);
    }

    // Verify office object has valid ID before creating budget
    if (!existingOffice || !existingOffice.id) {
      console.error(`[ERROR] existingOffice is invalid:`, existingOffice);
      return NextResponse.json(
        { error: `Invalid office object: ${JSON.stringify(existingOffice)}` },
        { status: 500 }
      );
    }

    console.log(`[PRE-CREATE] Office ID to use: ${existingOffice.id}, Office name: ${existingOffice.name}`);

    // Create budget with office connection using Prisma relation
    const newBudget = await prisma.budget.create({
      data: {
        ps: parseFloat(String(ps)),
        mooe: parseFloat(String(mooe)),
        co: parseFloat(String(co)),
        total: parseFloat(String(total)) || (parseFloat(String(ps)) + parseFloat(String(mooe)) + parseFloat(String(co))),
        officeId: existingOffice.id
      },
      include: { office: true },
    });

    const actor = getUserNameFromRequest(req);
    await logAction({
      message: `id=${newBudget.id}, office="${newBudget.office.name}", PS=${newBudget.ps}, MOOE=${newBudget.mooe}, CO=${newBudget.co}, total=${newBudget.total}`,
      type: "Budget",
      action: "create",
      performedBy: actor || undefined,
    });

    return NextResponse.json({
      message: "Budget added successfully",
      id: newBudget.id,
      office: newBudget.office.name,
      ps: newBudget.ps,
      mooe: newBudget.mooe,
      co: newBudget.co,
      total: newBudget.total,
      dateCreated: newBudget.dateCreated.toLocaleDateString(),
    });
  } catch (error: any) {
    console.error("POST /addbudget error:", error);
    
    // Provide more detailed error info for FK violations
    if (error.code === 'P2003') {
      console.error("❌ Foreign key constraint violation details:", {
        code: error.code,
        meta: error.meta,
        message: error.message,
      });
      return NextResponse.json(
        { 
          error: "Foreign key constraint violated - office may not exist",
          details: `FK violation: ${error.meta?.field_name || 'unknown field'}`,
          errorCode: error.code
        }, 
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to add budget", details: String(error), errorCode: error.code }, 
      { status: 500 }
    );
  }
}

// PUT update budget
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, office, ps, mooe, co, total } = body;

    // Find office by name, or create it if it doesn't exist
    let existingOffice = await prisma.office.findFirst({
      where: { name: office },
    });

    console.log(`[PUT /addbudget] Looking for office "${office}"...`);

    if (!existingOffice) {
      console.warn(`Office not found: "${office}". Auto-creating...`);
      try {
        existingOffice = await prisma.office.create({
          data: { name: office },
        });
        console.log(`✅ Office created: "${office}" with ID ${existingOffice.id}`);
      } catch (err: any) {
        if (err.code === 'P2002') {
          console.log(`Office create failed with P2002 (unique constraint), retrying find...`);
          existingOffice = await prisma.office.findFirst({
            where: { name: office },
          });
          if (!existingOffice) {
            return NextResponse.json(
              { error: `Failed to create or find office: "${office}"` },
              { status: 500 }
            );
          }
        } else {
          throw err;
        }
      }
    } else {
      console.log(`✅ Office found: "${office}" with ID ${existingOffice.id}`);
    }

    // Verify office object has valid ID before updating budget
    if (!existingOffice || !existingOffice.id) {
      console.error(`[ERROR] existingOffice is invalid:`, existingOffice);
      return NextResponse.json(
        { error: `Invalid office object: ${JSON.stringify(existingOffice)}` },
        { status: 500 }
      );
    }

    // Update using office connection
    const existing = await prisma.budget.findUnique({ where: { id }, include: { office: true } });
    const updated = await prisma.budget.update({
      where: { id },
      data: {
        ps,
        mooe,
        co,
        total,
        officeId: existingOffice.id
      },
      include: { office: true },
    });

    const actor = getUserNameFromRequest(req);
    await logAction({
      message: `id=${updated.id}: office "${existing?.office.name || "<unknown>"}" -> "${updated.office.name}", PS ${existing?.ps} -> ${updated.ps}, MOOE ${existing?.mooe} -> ${updated.mooe}, CO ${existing?.co} -> ${updated.co}, total ${existing?.total} -> ${updated.total}`,
      type: "Budget",
      action: "update",
      performedBy: actor || undefined,
    });

    return NextResponse.json({
      message: "Budget updated successfully",
      data: {
        id: updated.id,
        office: updated.office.name,
        ps: updated.ps,
        mooe: updated.mooe,
        co: updated.co,
        total: updated.total,
        dateCreated: updated.dateCreated.toLocaleDateString(),
      },
    });
  } catch (error: any) {
    console.error("PUT /addbudget error:", error);
    
    if (error.code === 'P2003') {
      console.error("❌ Foreign key constraint violation details:", {
        code: error.code,
        meta: error.meta,
        message: error.message,
      });
      return NextResponse.json(
        { 
          error: "Foreign key constraint violated - office may not exist",
          details: `FK violation: ${error.meta?.field_name || 'unknown field'}`,
          errorCode: error.code
        }, 
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: "Failed to update budget", errorCode: error.code }, { status: 500 });
  }
}

// DELETE budget
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    const existingBudget = await prisma.budget.findUnique({ 
      where: { id },
      include: { office: true }
    });
    await prisma.budget.delete({ where: { id } });
    const actor = getUserNameFromRequest(req);
    await logAction({
      message: `id=${id}, office="${existingBudget?.office?.name || "<unknown>"}", PS=${existingBudget?.ps}, MOOE=${existingBudget?.mooe}, CO=${existingBudget?.co}, total=${existingBudget?.total}`,
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
