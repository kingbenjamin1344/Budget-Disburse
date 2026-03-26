import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import logAction from "../../../lib/log";
import { getUserNameFromRequest } from "../../../lib/auth";


// ✅ GET all disbursements
export async function GET() {
  try {
    const disbursements = await prisma.disbursement.findMany({
      include: { office: true },
      orderBy: { id: "desc" },
    });

    const formatted = disbursements.map((d) => ({
      id: d.id,
      dvNo: d.dvNo,
      payee: d.payee,
      office: d.office?.name,
      expenseType: d.expenseType,
      expenseCategory: d.expenseCategory,
      amount: d.amount,
      dateCreated: d.dateCreated,
    }));

    return NextResponse.json(formatted, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error("GET /api/disbursement error:", error);
    return NextResponse.json(
      { error: "Failed to fetch disbursements" },
      { status: 500 }
    );
  }
}

// ✅ POST new disbursement
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dvNo, payee, office, expenseType, expenseCategory, amount, date } = body;

    // Find office by name, or create it if it doesn't exist
    let existingOffice = await prisma.office.findFirst({
      where: { name: office },
    });

    console.log(`[POST /disbursement] Looking for office "${office}"...`);

    if (!existingOffice) {
      console.warn(`Office not found in POST: "${office}". Auto-creating...`);
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

    // Verify office object has valid ID before creating disbursement
    if (!existingOffice || !existingOffice.id) {
      console.error(`[ERROR] existingOffice is invalid:`, existingOffice);
      return NextResponse.json(
        { error: `Invalid office object: ${JSON.stringify(existingOffice)}` },
        { status: 500 }
      );
    }

    const createData: any = {
      dvNo,
      payee,
      expenseType,
      expenseCategory,
      amount: parseFloat(amount),
      office: {
        connect: { id: existingOffice.id }
      }
    };
    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) createData.dateCreated = parsed;
    }

    const newDisbursement = await prisma.disbursement.create({
      data: createData,
      include: { office: true },
    });

    const actor = getUserNameFromRequest(req);
    await logAction({
      message: `${newDisbursement.dvNo}, payee="${newDisbursement.payee}", amount=${newDisbursement.amount}, office="${newDisbursement.office.name}", category="${newDisbursement.expenseCategory}" (id: ${newDisbursement.id})`,
      type: "Disbursement",
      action: "create",
      performedBy: actor || undefined,
    });

    return NextResponse.json({
      id: newDisbursement.id,
      dvNo: newDisbursement.dvNo,
      payee: newDisbursement.payee,
      office: newDisbursement.office.name,
      expenseType: newDisbursement.expenseType,
      expenseCategory: newDisbursement.expenseCategory,
      amount: newDisbursement.amount,
      dateCreated: newDisbursement.dateCreated,
    });
  } catch (error: any) {
    console.error("POST /api/disbursement error:", error);
    
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
      { error: "Failed to add disbursement", errorCode: error.code }, 
      { status: 500 }
    );
  }
}

// ✅ PUT update disbursement
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, dvNo, payee, office, expenseType, expenseCategory, amount, date } = body;

    // Find office by name, or create it if it doesn't exist
    let existingOffice = await prisma.office.findFirst({
      where: { name: office },
    });

    console.log(`[PUT /disbursement] Looking for office "${office}"...`);

    if (!existingOffice) {
      console.warn(`Office not found in PUT: "${office}". Auto-creating...`);
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

    // Verify office object has valid ID before updating disbursement
    if (!existingOffice || !existingOffice.id) {
      console.error(`[ERROR] existingOffice is invalid:`, existingOffice);
      return NextResponse.json(
        { error: `Invalid office object: ${JSON.stringify(existingOffice)}` },
        { status: 500 }
      );
    }

    const updateData: any = {
      dvNo,
      payee,
      expenseType,
      expenseCategory,
      amount: parseFloat(amount),
      office: {
        connect: { id: existingOffice.id }
      }
    };
    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) updateData.dateCreated = parsed;
    }

    const existing = await prisma.disbursement.findUnique({ where: { id }, include: { office: true } });
    const updated = await prisma.disbursement.update({
      where: { id },
      data: updateData,
      include: { office: true },
    });

    const actor = getUserNameFromRequest(req);
    await logAction({
      message: `id=${updated.id}: DV# "${existing?.dvNo || "<unknown>"}" -> "${updated.dvNo}", payee "${existing?.payee || "<unknown>"}" -> "${updated.payee}", amount ${existing?.amount || "<unknown>"} -> ${updated.amount}`,
      type: "Disbursement",
      action: "update",
      performedBy: actor || undefined,
    });

    return NextResponse.json({
      id: updated.id,
      dvNo: updated.dvNo,
      payee: updated.payee,
      office: updated.office.name,
      expenseType: updated.expenseType,
      expenseCategory: updated.expenseCategory,
      amount: updated.amount,
      dateCreated: updated.dateCreated,
    });
  } catch (error: any) {
    console.error("PUT /api/disbursement error:", error);
    
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
      { error: "Failed to update disbursement", errorCode: error.code },
      { status: 500 }
    );
  }
}

// ✅ DELETE disbursement
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    const toDelete = await prisma.disbursement.findUnique({ where: { id } });
    await prisma.disbursement.delete({ where: { id } });
    const actor = getUserNameFromRequest(req);
    await logAction({
      message: ` DV#${toDelete?.dvNo || "<unknown>"}, payee="${toDelete?.payee || "<unknown>"}", amount=${toDelete?.amount || "<unknown>"} (id: ${id})`,
      type: "Disbursement",
      action: "delete",
      performedBy: actor || undefined,
    });

    return NextResponse.json({ message: "Disbursement deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/disbursement error:", error);
    return NextResponse.json(
      { error: "Failed to delete disbursement" },
      { status: 500 }
    );
  }
}
