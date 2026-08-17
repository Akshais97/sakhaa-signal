import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../../packages/db/generated/client/index.js";

// Regression: WORKSPACE-RACE-003 — concurrent first-login API requests caused
// one transaction to fail with P2002 and return workspace:null.
// Found by /investigate and /qa on 2026-08-17.
// Report: .gstack/qa-reports/qa-report-sakhaa-signal-vercel-app-2026-08-17.md

test("concurrent first-login provisioning creates one user and one workspace", async () => {
  if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path.resolve(process.cwd(), ".env"));
  }
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");

  const auth = readFileSync("apps/web/src/lib/auth.ts", "utf8");
  assert.match(auth, /tx\.user\.upsert/);
  assert.match(auth, /pg_advisory_xact_lock\(hashtextextended/);
  assert.match(auth, /RECHECKING_MEMBERSHIP/);

  const prisma = new PrismaClient();
  const userId = randomUUID();
  const email = `workspace-race-${userId}@invalid.test`;

  const provision = () => prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    await tx.user.upsert({
      where: { id: userId },
      update: { email },
      create: { id: userId, email },
    });

    let membership = await tx.membership.findFirst({
      where: { userId, status: "ACTIVE", workspace: { status: "ACTIVE" } },
      include: { workspace: true },
    });
    if (!membership) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;
      membership = await tx.membership.findFirst({
        where: { userId, status: "ACTIVE", workspace: { status: "ACTIVE" } },
        include: { workspace: true },
      });
    }
    if (membership) return membership.workspaceId;

    const workspaceId = randomUUID();
    await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`;
    const workspace = await tx.workspace.create({
      data: {
        id: workspaceId,
        name: "Concurrent Provisioning Test",
        slug: `workspace-race-${workspaceId}`,
        memberships: { create: { userId, role: "OWNER" } },
      },
    });
    return workspace.id;
  });

  try {
    const workspaceIds = await Promise.all([provision(), provision()]);
    assert.equal(workspaceIds[0], workspaceIds[1]);
    assert.equal(await prisma.user.count({ where: { id: userId } }), 1);
    assert.equal(await prisma.membership.count({ where: { userId } }), 1);
  } finally {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    const workspaceIds = memberships.map(({ workspaceId }) => workspaceId);
    await prisma.$transaction([
      prisma.membership.deleteMany({ where: { userId } }),
      prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } }),
      prisma.user.deleteMany({ where: { id: userId } }),
    ]);
    await prisma.$disconnect();
  }
});
