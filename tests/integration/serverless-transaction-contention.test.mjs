import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { PrismaClient } from "../../packages/db/generated/client/index.js";

function singleConnectionUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  url.searchParams.set("connection_limit", "1");
  url.searchParams.set("pool_timeout", "20");
  url.searchParams.set("connect_timeout", "10");
  if (url.port === "6543") url.searchParams.set("pgbouncer", "true");
  return url.toString();
}

test("workspace transaction survives temporary contention on the serverless connection", async () => {
  if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path.resolve(process.cwd(), ".env"));
  }
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");

  const prisma = new PrismaClient({
    datasources: { db: { url: singleConnectionUrl(process.env.DATABASE_URL) } },
  });
  try {
    await prisma.$queryRaw`SELECT 1`;
    const blocker = prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_sleep(3)::text AS slept`;
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const workspaceResolution = prisma.$transaction(
      async (tx) => tx.$queryRaw`SELECT 1 AS ok`,
      { maxWait: 10_000, timeout: 20_000 },
    );

    const [, result] = await Promise.all([blocker, workspaceResolution]);
    assert.equal(result[0]?.ok, 1);
  } finally {
    await prisma.$disconnect();
  }
});
