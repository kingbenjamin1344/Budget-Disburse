import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

/**
 * DEBUG ENDPOINT - Inspect office table state
 */
export async function GET() {
  try {
    // Get all offices
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
      }
    });

    // Get budget count
    const budgetCount = await prisma.budget.count();
    const disbursementCount = await prisma.disbursement.count();

    console.log(`[DEBUG] Offices in DB: ${offices.length}`);
    console.log(`[DEBUG] Budgets in DB: ${budgetCount}`);
    console.log(`[DEBUG] Disbursements in DB: ${disbursementCount}`);

    return NextResponse.json({
      status: "OK",
      summary: {
        totalOffices: offices.length,
        totalBudgets: budgetCount,
        totalDisbursements: disbursementCount,
      },
      offices: offices,
      debugInfo: {
        timestamp: new Date().toISOString(),
        message: "If offices array is empty, migration seeding may have failed"
      }
    });
  } catch (error: any) {
    console.error("[DEBUG] Error checking offices:", error);
    return NextResponse.json(
      { 
        error: "Failed to inspect office table",
        details: String(error),
        errorCode: error.code
      },
      { status: 500 }
    );
  }
}
