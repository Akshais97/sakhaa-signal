import { PrismaClient } from "@sakhaa-forge/db";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  process.env.NODE_ENV === "development"
    ? new PrismaClient()
    : globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
