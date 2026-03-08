const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  // Fetch all expenses and offices
  const expenses = await prisma.expense.findMany();
  const offices = await prisma.office.findMany();

  if (!expenses.length || !offices.length) {
    console.error('No expenses or offices found.');
    process.exit(1);
  }

  const disbursements = [];
  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-03-31');

  for (let i = 0; i < 10000; i++) {
    const expense = expenses[randomInt(0, expenses.length - 1)];
    const office = offices[randomInt(0, offices.length - 1)];
    const amount = randomInt(10000, 100000);
    const dvNo = 'DV' + String(i + 1).padStart(5, '0');
    const payee = 'Payee ' + randomInt(1, 10000);
    const dateCreated = randomDate(startDate, endDate);

    disbursements.push({
      dvNo,
      payee,
      officeId: office.id,
      officeName: office.name,
      expenseType: expense.type,
      expenseCategory: expense.category,
      amount,
      dateCreated,
    });
  }

  // Insert in batches for performance
  const batchSize = 500;
  for (let i = 0; i < disbursements.length; i += batchSize) {
    const batch = disbursements.slice(i, i + batchSize);
    await prisma.disbursement.createMany({ data: batch });
    console.log(`Inserted batch ${i / batchSize + 1}`);
  }

  await prisma.$disconnect();
  console.log('Inserted 10,000 disbursements.');
}

main();
