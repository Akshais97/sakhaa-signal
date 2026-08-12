import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { PrismaClient } from "../../packages/db/generated/client/index.js";

test("restricted PostgreSQL role resolves only the user established in transaction-local RLS context", async () => {
  if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path.resolve(process.cwd(), ".env"));
  }
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");

  const prisma = new PrismaClient();
  try {
    const securityState = await prisma.$queryRaw`
      SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
             COALESCE(array_agg(p.policyname) FILTER (WHERE p.policyname IS NOT NULL), ARRAY[]::text[]) AS policies
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
      WHERE n.nspname = 'public' AND c.relname IN ('users', 'workspaces', 'memberships', 'artifacts')
      GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
      ORDER BY c.relname
    `;
    assert.deepEqual(
      securityState.map((row) => row.relname),
      ["artifacts", "memberships", "users", "workspaces"],
    );
    assert.ok(
      securityState.every((row) => row.relrowsecurity && row.policies.length > 0),
      JSON.stringify(securityState),
    );

    const fixture = await prisma.membership.findFirst({
      where: { status: "ACTIVE", workspace: { status: "ACTIVE" } },
      select: { userId: true, workspaceId: true },
    });
    assert.ok(fixture, "an active membership fixture is required");

    const withoutContext = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE authenticated");
      return tx.membership.findMany({ take: 1 });
    });
    assert.equal(withoutContext.length, 0, "RLS must hide memberships without user context");

    const withContext = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE authenticated");
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${fixture.userId}, true)`;
      const setting = await tx.$queryRaw`SELECT current_setting('app.current_user_id', true) AS user_id`;
      const functionValue = await tx.$queryRaw`SELECT public.app_current_user_id()::text AS user_id`;
      const visibleRows = await tx.$queryRaw`SELECT count(*)::int AS count FROM memberships`;
      const membership = await tx.membership.findFirst({
        where: { userId: fixture.userId, workspaceId: fixture.workspaceId, status: "ACTIVE" },
      });
      return { membership, setting, functionValue, visibleRows };
    });
    assert.equal(withContext.setting[0]?.user_id, fixture.userId);
    assert.equal(withContext.functionValue[0]?.user_id, fixture.userId);
    assert.ok(withContext.visibleRows[0]?.count > 0, "RLS context must expose at least one membership");
    assert.ok(withContext.membership, "RLS must reveal the authenticated user's active membership");
  } finally {
    await prisma.$disconnect();
  }
});
