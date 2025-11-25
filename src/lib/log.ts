import prisma from "./prisma";
import { Prisma } from "@prisma/client";

export type LogType = "Budget" | "Disbursement" | "Expense" | "Office" | string;
export type LogAction = "create" | "update" | "delete" | string;

export async function logAction({ message, type, action, performedBy }: { message: string; type: LogType; action: LogAction; performedBy?: string }) {
  try {
    // prisma.log may not exist at TypeScript compile time until you run `prisma generate`.
    // Cast to 'any' to avoid type compilation issues for now.
    await (prisma as any).log.create({
      data: { message, type, action, performedBy: performedBy || null },
    });
  } catch (error) {
    // If `log` table is missing, fail silently — logging shouldn't break main flow.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      // missing table, ignore
      return;
    }
    console.error("logAction error:", error);
    // Don't rethrow — logging should not break the main flow
  }
}

export default logAction;
