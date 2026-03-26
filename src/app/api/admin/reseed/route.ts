import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

/**
 * ADMIN ENDPOINT - FORCE RESEED OFFICES
 * Use only if offices are not seeded
 * GET /api/admin/reseed
 */
export async function GET() {
  try {
    console.log("[RESEED] Starting office reseed...");

    // Check current state
    const existingCount = await prisma.office.count();
    console.log(`[RESEED] Current offices: ${existingCount}`);

    const officeNames = [
      'Administrative Office',
      'Finance Department',
      'Human Resources',
      'Operations',
      'IT Department'
    ];

    const results: any[] = [];

    for (const name of officeNames) {
      try {
        const existing = await prisma.office.findFirst({ where: { name } });
        
        if (existing) {
          console.log(`[RESEED] ℹ️  Office already exists: ${name} (ID: ${existing.id})`);
          results.push({
            name,
            status: "EXISTS",
            id: existing.id
          });
        } else {
          const office = await prisma.office.create({
            data: { name }
          });
          console.log(`[RESEED] ✅ Created office: ${name} (ID: ${office.id})`);
          results.push({
            name,
            status: "CREATED",
            id: office.id
          });
        }
      } catch (err: any) {
        console.error(`[RESEED] ❌ Error with ${name}:`, err.message);
        results.push({
          name,
          status: "ERROR",
          error: err.message
        });
      }
    }

    // Verify
    const finalCount = await prisma.office.count();
    const finalOffices = await prisma.office.findMany({
      select: { id: true, name: true }
    });

    return NextResponse.json({
      status: "✅ RESEED COMPLETED",
      previousCount: existingCount,
      finalCount,
      results,
      allOffices: finalOffices,
      timestamp: new Date().toISOString(),
      nextSteps: finalCount > 0 ? [
        "✅ Offices seeded successfully!",
        "You can now try to create a budget"
      ] : [
        "❌ Reseed failed - offices still missing",
        "Check API logs for errors"
      ]
    });
  } catch (error: any) {
    console.error("[RESEED] Critical error:", error);
    return NextResponse.json(
      { 
        error: "Reseed failed",
        details: String(error),
        errorCode: error.code
      },
      { status: 500 }
    );
  }
}
