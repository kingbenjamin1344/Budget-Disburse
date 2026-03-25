import prisma from '@/lib/prisma';

/**
 * Seeds the admin user from environment variables on app startup.
 * Expects ADMIN_USERNAME and ADMIN_PASSWORD_HASH to be set.
 * ADMIN_PASSWORD_HASH must already be a valid bcrypt hash.
 * Skips creation silently if the user already exists.
 */
export async function seedAdminUser(): Promise<void> {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!username || !passwordHash) {
    // Environment variables not configured — skip seeding
    return;
  }

  try {
    const existing = await prisma.useradmin.findUnique({
      where: { username },
    });

    if (existing) {
      // Admin user already exists — nothing to do
      return;
    }

    await prisma.useradmin.create({
      data: {
        username,
        password: passwordHash,
      },
    });

    console.log(`✅ Admin user "${username}" seeded from environment variables.`);
  } catch (error) {
    // Log but do not crash the app — a missing admin record is better surfaced
    // at login time than as a startup failure.
    console.error('Failed to seed admin user:', error);
  }
}
