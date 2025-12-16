import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";
import logAction from "../../../lib/log";
import { getUserNameFromRequest } from "../../../lib/auth";

export async function GET() {
  const offices = await prisma.office.findMany({
    orderBy: { id: "desc" },
  });

  return NextResponse.json(offices, {
    headers: {
      "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

export async function POST(request: Request) {
  const { name } = await request.json();

  if (!name) {
    return NextResponse.json(
      { success: false, message: "Office name is required" },
      { status: 400 }
    );
  }

  const office = await prisma.office.create({ data: { name } });

  const actor = getUserNameFromRequest(request);
  await logAction({
    message: `${office.name} (id: ${office.id})`,
    type: "Office",
    action: "create",
    performedBy: actor || undefined,
  });

  return NextResponse.json({ success: true, data: office });
}

export async function PUT(request: Request) {
  const { id, name } = await request.json();

  if (!id || !name) {
    return NextResponse.json(
      { success: false, message: "ID and name are required" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.office.findUnique({ where: { id } });

    const updatedOffice = await prisma.office.update({
      where: { id },
      data: { name },
    });

    const actor = getUserNameFromRequest(request);
    await logAction({
      message: `(id: ${id}): "${existing?.name}" → "${updatedOffice.name}"`,
      type: "Office",
      action: "update",
      performedBy: actor || undefined,
    });

    return NextResponse.json({ success: true, data: updatedOffice });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to update office" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Office ID is required" },
      { status: 400 }
    );
  }

  try {
    const office = await prisma.office.findUnique({ where: { id } });

    if (!office) {
      return NextResponse.json(
        { success: false, message: "Office not found" },
        { status: 404 }
      );
    }

    // 🔒 CHECK DEPENDENCIES
    const budgetCount = await prisma.budget.count({
      where: { officeId: id },
    });

    const disbursementCount = await prisma.disbursement.count({
      where: { officeId: id },
    });

    if (budgetCount > 0 || disbursementCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Office cannot be deleted because it has existing budget or disbursement records.",
        },
        { status: 400 }
      );
    }

    // ✅ SAFE TO DELETE
    await prisma.office.delete({ where: { id } });

    const actor = getUserNameFromRequest(request);
    await logAction({
      message: `${office.name} (id: ${id})`,
      type: "Office",
      action: "delete",
      performedBy: actor || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Office deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete office due to server error",
      },
      { status: 500 }
    );
  }
}
