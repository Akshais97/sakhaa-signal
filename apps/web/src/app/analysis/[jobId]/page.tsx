import { notFound, redirect } from "next/navigation";
import StaticReport from "./static-report";
import VideoReport from "./video-report";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export default async function AnalysisPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { user, workspace: ws } = await getAuthenticatedSession();

  if (!user || !ws) {
    redirect(`/login?next=/analysis/${jobId}`);
  }

  let job: any = null;
  try {
    job = await prisma.analysisJob.findUnique({
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
  } catch (dbErr) {
    console.warn("[ANALYSIS_PAGE DB QUERY WARNING]", dbErr);
  }

  // Graceful fallback initial job state if DB record is not yet synced
  if (!job) {
    job = {
      id: jobId,
      workspaceId: ws.id,
      mode: "STATIC_STANDARD",
      status: "QUEUED",
      progressPercent: 10,
      currentStage: "DOWNLOAD_AND_VALIDATE",
      mediaType: "IMAGE",
      title: "Creative Analysis",
      selectedModel: "gpt-5.6-sol",
      stages: [
        { id: "stage-1", stageName: "DOWNLOAD_AND_VALIDATE", stageOrder: 1, status: "RUNNING" },
        { id: "stage-2", stageName: "PREPROCESSING", stageOrder: 2, status: "QUEUED" },
        { id: "stage-3", stageName: "COMPUTER_VISION", stageOrder: 3, status: "QUEUED" },
        { id: "stage-4", stageName: "RULE_EVALUATION", stageOrder: 4, status: "QUEUED" },
        { id: "stage-5", stageName: "DETERMINISTIC_SCORING", stageOrder: 5, status: "QUEUED" },
        { id: "stage-6", stageName: "MULTIMODAL_GPT_SYNTHESIS", stageOrder: 6, status: "QUEUED" },
        { id: "stage-7", stageName: "REPORT_PUBLISHING", stageOrder: 7, status: "QUEUED" },
      ],
      evidence: [],
      ruleResults: [],
      categoryScores: [],
      findings: [],
      reports: [],
    };
  }

  const isVideo =
    job.mediaType === "VIDEO" ||
    job.mode === "VIDEO_STANDARD" ||
    (typeof job.inputObjectKey === "string" && job.inputObjectKey.match(/\.(mp4|mov|webm)$/i));

  if (isVideo) {
    return <VideoReport job={job} />;
  }

  return <StaticReport job={job} />;
}
