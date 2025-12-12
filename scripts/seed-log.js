const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const newLog = await prisma.log.create({
      data: {
        message: 'Seed: Inserted test log from scripts/seed-log.js',
        type: 'Debug',
        action: 'create',
        performedBy: 'seed-script',
      },
    });
    console.log('Inserted test log', newLog);
  } catch (e) {
    console.error('Failed inserting test log', e.message || e);
    if (e.code === 'P2021') {
      console.error('Log table does not exist. Please run `npx prisma migrate dev` first.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
