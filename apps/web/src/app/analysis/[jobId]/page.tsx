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

  if (!job) {
    notFound();
  }

  // Workspace access check: ensure viewer belongs to job's workspace or is platform admin
  const isWorkspaceMatch = job.workspaceId === ws.id;
  if (!isWorkspaceMatch && !user.isPlatformAdmin) {
    const membership = await prisma.membership.findFirst({
      where: { workspaceId: job.workspaceId, userId: user.id },
    });
    if (!membership) {
      notFound();
    }
  }

  const isVideo = job.mediaType === "VIDEO" || job.mode === "VIDEO_STANDARD" || job.inputObjectKey?.match(/\.(mp4|mov|webm)$/i);

  if (isVideo) {
    return <VideoReport job={job} />;
  }

  return <StaticReport job={job} />;
}
