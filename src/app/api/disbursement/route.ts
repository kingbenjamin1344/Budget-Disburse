import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      office: d.officeName || d.office?.name,
      expenseType: d.expenseType,
      expenseCategory: d.expenseCategory,
      amount: d.amount,
      dateCreated: d.dateCreated,
    }));

    return NextResponse.json(formatted);
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
    const { dvNo, payee, office, expenseType, expenseCategory, amount } = body;

    const existingOffice = await prisma.office.findFirst({
      where: { name: office },
    });

    if (!existingOffice) {
      return NextResponse.json({ error: "Office not found" }, { status: 400 });
    }

    const newDisbursement = await prisma.disbursement.create({
      data: {
        dvNo,
        payee,
        officeId: existingOffice.id,
        officeName: existingOffice.name,
        expenseType,
        expenseCategory,
        amount: parseFloat(amount),
      },
      include: { office: true },
    });

    return NextResponse.json({
      id: newDisbursement.id,
      dvNo: newDisbursement.dvNo,
      payee: newDisbursement.payee,
      office: newDisbursement.officeName,
      expenseType: newDisbursement.expenseType,
      expenseCategory: newDisbursement.expenseCategory,
      amount: newDisbursement.amount,
      dateCreated: newDisbursement.dateCreated,
    });
  } catch (error) {
    console.error("POST /api/disbursement error:", error);
    return NextResponse.json(
      { error: "Failed to add disbursement" },
      { status: 500 }
    );
  }
}

// ✅ PUT update disbursement
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, dvNo, payee, office, expenseType, expenseCategory, amount } = body;

    const existingOffice = await prisma.office.findFirst({
      where: { name: office },
    });

    if (!existingOffice) {
      return NextResponse.json({ error: "Office not found" }, { status: 400 });
    }

    const updated = await prisma.disbursement.update({
      where: { id },
      data: {
        dvNo,
        payee,
        officeId: existingOffice.id,
        officeName: existingOffice.name,
        expenseType,
        expenseCategory,
        amount: parseFloat(amount),
      },
      include: { office: true },
    });

    return NextResponse.json({
      id: updated.id,
      dvNo: updated.dvNo,
      payee: updated.payee,
      office: updated.officeName,
      expenseType: updated.expenseType,
      expenseCategory: updated.expenseCategory,
      amount: updated.amount,
      dateCreated: updated.dateCreated,
    });
  } catch (error) {
    console.error("PUT /api/disbursement error:", error);
    return NextResponse.json(
      { error: "Failed to update disbursement" },
      { status: 500 }
    );
  }
}

// ✅ DELETE disbursement
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    await prisma.disbursement.delete({
      where: { id },
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
