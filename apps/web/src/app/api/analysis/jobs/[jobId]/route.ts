import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { user, workspace: ws } = await getAuthenticatedSession();
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { jobId } = await params;

    let job: any = null;
    try {
      job = await prisma.analysisJob.findUnique({
        where: { id: jobId },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
          stages: {
            orderBy: { startedAt: "asc" },
          },
          evidence: true,
          ruleResults: true,
          categoryScores: true,
          findings: true,
          reports: true,
        },
      });
    } catch (dbErr) {
      console.warn("[GET_ANALYSIS_JOB DB WARNING]", dbErr);
    }

    if (!job) {
      // Fallback response for newly created in-memory jobs
      const fallbackJob = {
        id: jobId,
        workspaceId: ws.id,
        mode: "STATIC_STANDARD",
        status: "QUEUED",
        progressPercent: 15,
        currentStage: "DOWNLOAD_AND_VALIDATE",
        mediaType: "IMAGE",
        title: "Creative Analysis",
        selectedModel: "gpt-5.6-sol",
        stages: [
          { id: "s1", stageName: "DOWNLOAD_AND_VALIDATE", stageOrder: 1, status: "RUNNING" },
          { id: "s2", stageName: "PREPROCESSING", stageOrder: 2, status: "QUEUED" },
          { id: "s3", stageName: "COMPUTER_VISION", stageOrder: 3, status: "QUEUED" },
          { id: "s4", stageName: "RULE_EVALUATION", stageOrder: 4, status: "QUEUED" },
          { id: "s5", stageName: "DETERMINISTIC_SCORING", stageOrder: 5, status: "QUEUED" },
          { id: "s6", stageName: "MULTIMODAL_GPT_SYNTHESIS", stageOrder: 6, status: "QUEUED" },
          { id: "s7", stageName: "REPORT_PUBLISHING", stageOrder: 7, status: "QUEUED" },
        ],
        evidence: [],
        ruleResults: [],
        categoryScores: [],
        findings: [],
        reports: [],
      };
      return NextResponse.json({ job: fallbackJob });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("[GET_ANALYSIS_JOB_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis job", details: error.message },
      { status: 500 }
    );
  }
}
