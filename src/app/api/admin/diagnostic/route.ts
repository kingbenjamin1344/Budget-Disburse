import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

/**
 * COMPREHENSIVE DIAGNOSTIC ENDPOINT
 * Shows: office count, office IDs, budgets, disbursements, and any issues
 */
export async function GET() {
  try {
    // 1. Get all offices
    const offices = await prisma.office.findMany({
      select: {
        id: true,
        name: true,
        dateCreated: true,
        _count: {
          select: {
            budget: true,
            disbursement: true,
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    // 2. Get budgets
    const budgets = await prisma.budget.findMany({
      include: { office: true },
      orderBy: { id: 'asc' }
    });

    // 3. Get disbursements
    const disbursements = await prisma.disbursement.findMany({
      include: { office: true },
      orderBy: { id: 'asc' }
    });

    // 4. Get expenses
    const expenses = await prisma.expense.findMany();

    // 5. Diagnose issues
    const issues: string[] = [];
    
    if (offices.length === 0) {
      issues.push("❌ CRITICAL: No offices in database! Budget/Disbursement saves will fail with FK violation.");
    }
    
    if (budgets.length > 0) {
      const budgetsWithoutOffice = budgets.filter(b => !b.office);
      if (budgetsWithoutOffice.length > 0) {
        issues.push(`⚠️  WARNING: ${budgetsWithoutOffice.length} budget(s) have no office assigned`);
      }
    }

    if (disbursements.length > 0) {
      const disburseWithoutOffice = disbursements.filter(d => !d.office);
      if (disburseWithoutOffice.length > 0) {
        issues.push(`⚠️  WARNING: ${disburseWithoutOffice.length} disbursement(s) have no office assigned`);
      }
    }

    return NextResponse.json({
      status: issues.length === 0 ? "✅ HEALTHY" : "❌ ISSUES DETECTED",
      summary: {
        totalOffices: offices.length,
        totalBudgets: budgets.length,
        totalDisbursements: disbursements.length,
        totalExpenses: expenses.length,
      },
      offices: offices.map(o => ({
        id: o.id,
        name: o.name,
        createdAt: o.dateCreated,
        budgets: o._count.budget,
        disbursements: o._count.disbursement
      })),
      recentBudgets: budgets.slice(-3).reverse().map(b => ({
        id: b.id,
        officeId: b.officeId,
        officeName: b.office?.name || "❌ NO OFFICE!",
        ps: b.ps,
        total: b.total,
        createdAt: b.dateCreated
      })),
      recentDisbursements: disbursements.slice(-3).reverse().map(d => ({
        id: d.id,
        officeId: d.officeId,
        officeName: d.office?.name || "❌ NO OFFICE!",
        dvNo: d.dvNo,
        amount: d.amount
      })),
      issues,
      timestamp: new Date().toISOString(),
      nextSteps: issues.length > 0 ? [
        "1. If no offices: Run migration or manually create offices",
        "2. Check Railway deployment logs for migration errors",
        "3. Try the debug endpoint: GET /api/admin/reseed to force-seed offices"
      ] : ["✅ All systems nominal!"]
    });
  } catch (error: any) {
    console.error("[DIAGNOSTIC] Error:", error);
    return NextResponse.json(
      { 
        error: "Diagnostic failed",
        details: String(error),
        errorCode: error.code,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
