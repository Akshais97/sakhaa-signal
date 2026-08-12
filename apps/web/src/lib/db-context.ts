import type { Prisma } from "@sakhaa-forge/db";
import prisma from "./db";

export async function setWorkspaceContext(
  tx: Prisma.TransactionClient,
  workspaceId: string,
): Promise<void> {
  await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`;
}

export async function withUserDatabaseContext<T>(
  userId: string,
  workspaceId: string | null,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    if (workspaceId) await setWorkspaceContext(tx, workspaceId);
    return operation(tx);
  });
}
