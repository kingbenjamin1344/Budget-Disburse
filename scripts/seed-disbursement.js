const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Generate DV No. in format 000-0000-00-0000
const generateDVNo = (index) => {
  const part1 = String(Math.floor(index / 1000000) % 1000).padStart(3, '0');
  const part2 = String(Math.floor(index / 1000) % 10000).padStart(4, '0');
  const part3 = String(Math.floor(index / 100) % 100).padStart(2, '0');
  const part4 = String(index % 10000).padStart(4, '0');
  return `${part1}-${part2}-${part3}-${part4}`;
};

// Payee names
const payeeNames = [
  'John Smith', 'Maria Garcia', 'Robert Johnson', 'Jennifer Lee',
  'Michael Brown', 'Amanda Davis', 'David Wilson', 'Sarah Miller',
  'James Moore', 'Lisa Anderson', 'Jose Martinez', 'Karen Taylor'
];

// Expense types for each category
const expenseTypesByCategory = {
  'PS': ['Salaries', 'Wages', 'Bonuses'],
  'MOOE': ['Utilities', 'Supplies', 'Maintenance'],
  'CO': ['Equipment', 'Vehicles', 'Furniture']
};

async function seedDisbursements() {
  try {
    // Get all offices
    const offices = await prisma.office.findMany();
    if (offices.length === 0) {
      console.log('❌ No offices found. Please seed offices first.');
      return;
    }

    console.log(`✅ Found ${offices.length} offices`);

    // Get all expenses to verify categories exist
    const expenses = await prisma.expense.findMany();
    if (expenses.length === 0) {
      console.log('❌ No expenses found. Please seed expenses first.');
      return;
    }

    const categories = ['PS', 'MOOE', 'CO'];
    const months = [
      { name: 'January', monthIndex: 0 },
      { name: 'February', monthIndex: 1 },
      { name: 'March', monthIndex: 2 },
      { name: 'April', monthIndex: 3 }
    ];

    let dvIndex = 1;
    let disbursementCount = 0;

    // For each office
    for (const office of offices) {
      console.log(`\n📍 Seeding disbursements for: ${office.name}`);

      // For each month (Jan to April)
      for (const monthData of months) {
        // Create 3 disbursements per month (one for each category)
        for (const category of categories) {
          const dvNo = generateDVNo(dvIndex++);
          const randomAmount = Math.floor(Math.random() * 9000) + 1000; // 1000-10000
          const randomPayee = payeeNames[Math.floor(Math.random() * payeeNames.length)];
          const randomExpenseType = expenseTypesByCategory[category][
            Math.floor(Math.random() * expenseTypesByCategory[category].length)
          ];

          // Generate random date within the month
          const dateObj = new Date(2026, monthData.monthIndex, Math.floor(Math.random() * 28) + 1);

          // Check if expense type exists with this category
          const expenseExists = expenses.some(
            e => e.type === randomExpenseType && e.category === category
          );

          if (!expenseExists) {
            // Create the expense if it doesn't exist
            await prisma.expense.create({
              data: {
                type: randomExpenseType,
                category: category
              }
            });
            console.log(`  ✅ Created expense: ${randomExpenseType} (${category})`);
          }

          const disbursement = await prisma.disbursement.create({
            data: {
              dvNo: dvNo,
              payee: randomPayee,
              office: office.name,
              expenseType: randomExpenseType,
              expenseCategory: category,
              amount: randomAmount,
              dateCreated: dateObj
            }
          });

          console.log(`  ✅ Created DV: ${dvNo} | ${randomPayee} | ${category} | ₱${randomAmount.toLocaleString()}`);
          disbursementCount++;
        }
      }
    }

    console.log(`\n✅ Successfully seeded ${disbursementCount} disbursements!`);
    console.log(`📊 Details: ${offices.length} offices × 4 months × 3 categories = ${offices.length * 4 * 3} records`);

  } catch (error) {
    console.error('❌ Error seeding disbursements:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDisbursements();
