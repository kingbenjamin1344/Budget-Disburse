import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";
import logAction from "../../../lib/log";
import { getUserNameFromRequest } from "../../../lib/auth";

// Add timeout wrapper
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Database query timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export async function GET() {
  try {
    const offices = await withTimeout(
      prisma.office.findMany({
        orderBy: { id: "desc" },
      }),
      5000 // 5 second timeout
    );
    return NextResponse.json(offices, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching offices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offices', offices: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const data = await request.json();
  const { name } = data;

  if (!name) {
    return NextResponse.json({ error: "Office name is required" }, { status: 400 });
  }

  const office = await prisma.office.create({ data: { name } });
  const actor = getUserNameFromRequest(request);
  await logAction({ message: `${office.name} (id: ${office.id})`, type: "Office", action: "create", performedBy: actor || undefined });

  return NextResponse.json(office);
}


export async function PUT(request: Request) {
  const data = await request.json();
  const { id, name } = data;

  if (!id || !name) {
    return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
  }

  try {
    const existing = await prisma.office.findUnique({ where: { id } });
    const updatedOffice = await prisma.office.update({ where: { id }, data: { name } });
    const actor = getUserNameFromRequest(request);
    await logAction({ message: `(id: ${id}): name "${existing?.name || "<unknown>"}" -> "${updatedOffice.name}"`, type: "Office", action: "update", performedBy: actor || undefined });
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

  const toDelete = await prisma.office.findUnique({ where: { id } });
  await prisma.office.delete({ where: { id } });
  const actor = getUserNameFromRequest(request);
  await logAction({ message: `${toDelete?.name || "<unknown>"} (id: ${id})`, type: "Office", action: "delete", performedBy: actor || undefined });

  return NextResponse.json({ message: "Office deleted successfully" });
}
