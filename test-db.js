require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const result = await prisma.useradmin.findMany();
    console.log('✅ Connection successful!');
    console.log('Users:', result);
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
