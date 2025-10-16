import { NextResponse } from "next/server";

let disbursements: any[] = [];
let nextId = 1;

export async function GET() {
  return NextResponse.json(disbursements);
}

export async function POST(req: Request) {
  const { dvNo, payee, office, expenseType, expenseCategory, amount, dateCreated } =
    await req.json();

  if (!dvNo || !payee || !office || !expenseType || !amount) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const newItem = {
    id: nextId++,
    dvNo,
    payee,
    office,
    expenseType,
    expenseCategory,
    amount,
    dateCreated: dateCreated || new Date().toISOString(),
  };

  disbursements.push(newItem);
  return NextResponse.json(newItem);
}

export async function PUT(req: Request) {
  const { id, dvNo, payee, office, expenseType, expenseCategory, amount } = await req.json();

  const index = disbursements.findIndex((d) => d.id === id);
  if (index === -1)
    return NextResponse.json({ message: "Disbursement not found" }, { status: 404 });

  disbursements[index] = {
    ...disbursements[index],
    dvNo,
    payee,
    office,
    expenseType,
    expenseCategory,
    amount,
  };
  return NextResponse.json(disbursements[index]);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  disbursements = disbursements.filter((d) => d.id !== id);
  return NextResponse.json({ message: "Deleted" });
}
