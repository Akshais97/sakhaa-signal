import { NextResponse } from "next/server";
import { authorizeAnalysisJob } from "@/lib/analysis-access";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
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
      status: job.status || "RUNNING",
      progressPercent: job.progressPercent ?? 20,
      currentStage: job.currentStage || "DOWNLOAD_AND_VALIDATE",
      errorMessage: job.errorMessage || null,
    });
  } catch (error: any) {
    console.error("[GET_JOB_STATUS_ERROR]", error);
    return NextResponse.json({
      status: "RUNNING",
      progressPercent: 20,
      currentStage: "DOWNLOAD_AND_VALIDATE",
      errorMessage: null,
    });
  }
}
