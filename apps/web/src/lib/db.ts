import { PrismaClient } from "@sakhaa-forge/db";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function getDbUrl() {
  const url = process.env.DATABASE_URL || "";
  if (!url) return undefined;
  // If connection_limit is already set to a tiny value like 2, replace it with optimal pool limit 10
  if (url.includes("connection_limit=")) {
    return url.replace(/connection_limit=\d+/, "connection_limit=10");
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=10&pool_timeout=20`;
}

const dbUrl = getDbUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
