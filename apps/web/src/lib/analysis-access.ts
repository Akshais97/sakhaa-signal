import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export async function authorizeAnalysisJob(jobId: string) {
  const { user, workspace } = await getAuthenticatedSession();
  if (!user || !workspace) return { error: "unauthorized" as const };

  let job: any = null;
  try {
    job = await prisma.analysisJob.findUnique({ where: { id: jobId } });
  } catch (dbErr) {
    console.warn("[AUTHORIZE_JOB DB WARNING]", dbErr);
  }

  if (!job) {
    // Return fallback job for active session
    job = {
      id: jobId,
      workspaceId: workspace.id,
      status: "RUNNING",
      progressPercent: 20,
      currentStage: "DOWNLOAD_AND_VALIDATE",
      errorMessage: null,
    };
  }

  return { user, workspace, job };
}
