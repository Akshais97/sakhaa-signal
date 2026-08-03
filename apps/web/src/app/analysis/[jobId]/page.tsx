import { notFound } from "next/navigation";
import StaticReport from "./static-report";
import VideoReport from "./video-report";
import prisma from "@/lib/db";

export default async function AnalysisPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

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

  const isVideo = job.mediaType === "VIDEO" || job.mode === "VIDEO_STANDARD" || job.inputObjectKey?.match(/\.(mp4|mov|webm)$/i);

  if (isVideo) {
    return <VideoReport job={job} />;
  }

  return <StaticReport job={job} />;
}
