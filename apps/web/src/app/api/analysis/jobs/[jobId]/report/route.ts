import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authorizeAnalysisJob } from "@/lib/analysis-access";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const access = await authorizeAnalysisJob(jobId);
  if ("error" in access) {
    if (access.error === "database_unavailable") {
      return NextResponse.json(
        { error: "Analysis report is temporarily unavailable", code: "REPORT_UNAVAILABLE" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: access.error === "unauthorized" ? "Unauthorized" : "Job not found" },
      { status: access.error === "unauthorized" ? 401 : 404 },
    );
  }
  if (access.job.status !== "SUCCEEDED") {
    return NextResponse.json({ error: "Report is not ready" }, { status: 409 });
  }

  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    include: {
      stages: true,
      evidence: true,
      ruleResults: true,
      categoryScores: true,
      findings: true,
      reports: true,
    },
  });
  return NextResponse.json({ job });
}
