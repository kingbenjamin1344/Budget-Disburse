import { NextResponse } from "next/server";

let disbursements: any[] = [];
let nextId = 1;

export async function GET() {
  return NextResponse.json(disbursements);
}

export async function POST(req: Request) {
  const { dvNo, payee, office, expenseType, expenseCategory, dateCreated } = await req.json();

  if (!dvNo || !payee || !office || !expenseType || !dateCreated) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  const newItem = {
    id: nextId++,
    dvNo,
    payee,
    office,
    expenseType,
    expenseCategory,
    dateCreated,
  };

  disbursements.push(newItem);
  return NextResponse.json(newItem);
}

export async function PUT(req: Request) {
  const { id, dvNo, payee, office, expenseType, expenseCategory, dateCreated } = await req.json();

  const index = disbursements.findIndex((d) => d.id === id);
  if (index === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });

  disbursements[index] = { ...disbursements[index], dvNo, payee, office, expenseType, expenseCategory, dateCreated };
  return NextResponse.json(disbursements[index]);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  disbursements = disbursements.filter((d) => d.id !== id);
  return NextResponse.json({ message: "Deleted" });
}
