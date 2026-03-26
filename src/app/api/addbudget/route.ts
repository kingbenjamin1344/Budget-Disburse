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
    let { office, ps, mooe, co, total } = body;

    // Validate and sanitize office input
    if (!office || (typeof office === 'string' && office.trim() === '')) {
      return NextResponse.json(
        { error: "Office name is required" }, 
        { status: 400 }
      );
    }

    if (ps === undefined || mooe === undefined || co === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: ps, mooe, co" }, 
        { status: 400 }
      );
    }

    // Trim and normalize office name
    office = String(office).trim();
    ps = parseFloat(String(ps));
    mooe = parseFloat(String(mooe));
    co = parseFloat(String(co));
    total = parseFloat(String(total)) || (ps + mooe + co);

    // Validate parsed numbers
    if (isNaN(ps) || isNaN(mooe) || isNaN(co)) {
      return NextResponse.json(
        { error: "PS, MOOE, CO must be valid numbers" }, 
        { status: 400 }
      );
    }

    console.log(`\n📝 [POST /addbudget] Saving budget for office: "${office}" (ps=${ps}, mooe=${mooe}, co=${co})`);

    // Atomically find or create office (no race conditions)
    const existingOffice = await prisma.office.upsert({
      where: { name: office },
      update: {},
      create: { name: office },
    });
    console.log(`✅ Office ready: "${office}" (ID: ${existingOffice.id})`);

    // Verify office ID is valid
    if (!existingOffice?.id || typeof existingOffice.id !== 'number') {
      console.error(`❌ Invalid office ID:`, existingOffice);
      return NextResponse.json(
        { error: "Invalid office data - cannot save budget" },
        { status: 500 }
      );
    }

    console.log(`✓ Using officeId: ${existingOffice.id}`);

    // Create budget with direct officeId assignment
    const newBudget = await prisma.budget.create({
      data: {
        ps,
        mooe,
        co,
        total,
        officeId: existingOffice.id
      },
      include: { office: true },
    });

    console.log(`✅ Budget created successfully (ID: ${newBudget.id})`);

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
    const { id } = body;
    let { office, ps, mooe, co, total } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Budget ID is required" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    office = String(office).trim();
    ps = parseFloat(String(ps));
    mooe = parseFloat(String(mooe));
    co = parseFloat(String(co));
    total = parseFloat(String(total)) || (ps + mooe + co);

    // Validate
    if (!office || isNaN(ps) || isNaN(mooe) || isNaN(co)) {
      return NextResponse.json(
        { error: "Invalid input - office and amounts required" },
        { status: 400 }
      );
    }

    console.log(`\n📝 [PUT /addbudget] Updating budget ${id} for office: "${office}"`);

    // Atomically find or create office (no race conditions)
    const existingOffice = await prisma.office.upsert({
      where: { name: office },
      update: {},
      create: { name: office },
    });
    console.log(`✅ Office ready: "${office}" (ID: ${existingOffice.id})`);

    if (!existingOffice?.id || typeof existingOffice.id !== 'number') {
      console.error(`❌ Invalid office ID:`, existingOffice);
      return NextResponse.json(
        { error: "Invalid office - cannot update budget" },
        { status: 500 }
      );
    }

    // Update budget
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

    console.log(`✅ Budget ${id} updated successfully`);

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
