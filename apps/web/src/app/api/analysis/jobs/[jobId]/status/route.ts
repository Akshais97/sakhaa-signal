import { NextResponse } from "next/server";
import { authorizeAnalysisJob } from "@/lib/analysis-access";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const access = await authorizeAnalysisJob(jobId);
  if ("error" in access) {
    return NextResponse.json(
      { error: access.error === "unauthorized" ? "Unauthorized" : "Job not found" },
      { status: access.error === "unauthorized" ? 401 : 404 },
    );
  }

  const { job } = access;
  return NextResponse.json({
    id: job.id,
    status: job.status,
    progressPercent: job.progressPercent,
    currentStage: job.currentStage,
    errorMessage: job.errorMessage,
  });
}
