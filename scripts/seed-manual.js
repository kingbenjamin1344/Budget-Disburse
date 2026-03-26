const PrismaClient = require('@prisma/client').PrismaClient;

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking current offices...');
    const existingOffices = await prisma.office.findMany();
    console.log(`Found ${existingOffices.length} offices:`, existingOffices);

    if (existingOffices.length === 0) {
      console.log('\n❌ No offices found! Seeding now...');
      
      const officeNames = [
        'Administrative Office',
        'Finance Department',
        'Human Resources',
        'Operations',
        'IT Department'
      ];

      for (const name of officeNames) {
        try {
          const office = await prisma.office.create({
            data: { name }
          });
          console.log(`✅ Created office: ${name} (ID: ${office.id})`);
        } catch (err) {
          if (err.code === 'P2002') {
            console.log(`⚠️  Office already exists: ${name}`);
          } else {
            throw err;
          }
        }
      }

      const afterSeed = await prisma.office.findMany();
      console.log(`\n✅ After seeding: ${afterSeed.length} offices total`);
      console.log(afterSeed);
    } else {
      console.log('\n✅ Offices are already seeded!');
    }

    // Also check expenses
    console.log('\n🔍 Checking expenses...');
    const expenses = await prisma.expense.findMany();
    console.log(`Found ${expenses.length} expenses`);

    // Check budgets
    console.log('\n🔍 Checking budgets...');
    const budgets = await prisma.budget.findMany({ include: { office: true } });
    console.log(`Found ${budgets.length} budgets:`, budgets);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
