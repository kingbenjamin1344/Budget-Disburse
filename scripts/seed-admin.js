const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';

  console.log(`Creating admin user with username: ${username}`);
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Delete existing user if exists (optional)
  try {
    await prisma.useradmin.deleteMany({
      where: { username },
    });
    console.log(`Deleted existing user: ${username}`);
  } catch (e) {
    // Ignore if user doesn't exist
  }

  // Create new admin user
  const user = await prisma.useradmin.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  console.log(`✅ Admin user created successfully!`);
  console.log(`Username: ${user.username}`);
  console.log(`Password: ${password} (hashed in database)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
