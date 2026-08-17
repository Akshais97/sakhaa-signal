import { NextResponse } from "next/server";
import { authorizeAnalysisJob } from "@/lib/analysis-access";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await context.params;
    const access = await authorizeAnalysisJob(jobId);
    if ("error" in access) {
      if (access.error === "database_unavailable") {
        return NextResponse.json(
          { error: "Job status is temporarily unavailable", code: "JOB_STATUS_UNAVAILABLE" },
          { status: 503 },
        );
      }
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
      errorMessage: job.errorMessage || null,
    });
  } catch (error: unknown) {
    console.error("[GET_JOB_STATUS_ERROR]", error);
    return NextResponse.json(
      { error: "Job status is temporarily unavailable", code: "JOB_STATUS_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
