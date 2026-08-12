import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { PrismaClient } from "../../packages/db/generated/client/index.js";

test("the restricted database role can execute the complete existing-workspace resolution path", async () => {
  if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path.resolve(process.cwd(), ".env"));
  }
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");

  const prisma = new PrismaClient();
  try {
    const fixture = await prisma.membership.findFirst({
      where: { status: "ACTIVE", workspace: { status: "ACTIVE" } },
      select: { userId: true, workspaceId: true },
    });
    assert.ok(fixture, "an active membership fixture is required");

    const resolved = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE authenticated");
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${fixture.userId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${fixture.workspaceId}, true)`;

      const user = await tx.user.findUnique({ where: { id: fixture.userId } });
      const platformAdmin = await tx.platformAdmin.findUnique({ where: { userId: fixture.userId } });
      const workspace = await tx.workspace.findFirst({
        where: {
          id: fixture.workspaceId,
          status: "ACTIVE",
          memberships: { some: { userId: fixture.userId, status: "ACTIVE" } },
        },
      });
      const membership = await tx.membership.findFirst({
        where: {
          userId: fixture.userId,
          status: "ACTIVE",
          workspace: { status: "ACTIVE" },
        },
        include: { workspace: true },
      });
      return { user, platformAdmin, workspace, membership };
    });

    assert.ok(resolved.user, "the authenticated public user must be visible");
    assert.equal(resolved.workspace?.id, fixture.workspaceId);
    assert.equal(resolved.membership?.workspaceId, fixture.workspaceId);
  } finally {
    await prisma.$disconnect();
  }
});
