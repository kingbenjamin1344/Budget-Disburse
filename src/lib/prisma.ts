import { PrismaClient } from "@prisma/client";

// Avoid multiple PrismaClient instances in development due to hot reloading
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.__prisma = prisma;

export default prisma;
