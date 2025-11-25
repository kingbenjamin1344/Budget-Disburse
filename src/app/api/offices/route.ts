import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";
import logAction from "../../../lib/log";
import { getUserNameFromRequest } from "../../../lib/auth";


export async function GET() {
  const offices = await prisma.office.findMany({
    orderBy: { id: "desc" },
  });
  return NextResponse.json(offices);
}

export async function POST(request: Request) {
  const data = await request.json();
  const { name } = data;

  if (!name) {
    return NextResponse.json({ error: "Office name is required" }, { status: 400 });
  }

  const office = await prisma.office.create({
    data: { name },
  });

  const actor = getUserNameFromRequest(request);
  await logAction({ message: `Created office ${office.name} (id: ${office.id})`, type: "Office", action: "create", performedBy: actor || undefined });

  return NextResponse.json(office);
}


export async function PUT(request: Request) {
  const data = await request.json();
  const { id, name } = data;

  if (!id || !name) {
    return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
  }

  try {
    const updatedOffice = await prisma.office.update({
      where: { id },
      data: { name },
    });
    const actor = getUserNameFromRequest(request);
    await logAction({ message: `Updated office ${updatedOffice.name} (id: ${updatedOffice.id})`, type: "Office", action: "update", performedBy: actor || undefined });
    return NextResponse.json(updatedOffice);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Office ID is required" }, { status: 400 });
  }

  await prisma.office.delete({
    where: { id },
  });

  const actor = getUserNameFromRequest(request);
  await logAction({ message: `Deleted office (id: ${id})`, type: "Office", action: "delete", performedBy: actor || undefined });

  return NextResponse.json({ message: "Office deleted successfully" });
}
