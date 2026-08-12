import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export async function authorizeAnalysisJob(jobId: string) {
  const { user, workspace } = await getAuthenticatedSession();
  if (!user || !workspace) return { error: "unauthorized" as const };

  try {
    const job = await prisma.analysisJob.findUnique({ where: { id: jobId } });
    if (!job) return { error: "not_found" as const };

    if (job.workspaceId !== workspace.id && !user.isPlatformAdmin) {
      const membership = await prisma.membership.findFirst({
        where: { workspaceId: job.workspaceId, userId: user.id, status: "ACTIVE" },
        select: { id: true },
      });
      if (!membership) return { error: "not_found" as const };
    }

    return { user, workspace, job };
  } catch (error) {
    console.error("[AUTHORIZE_JOB_DB_ERROR]", error);
    return { error: "database_unavailable" as const };
  }
}
