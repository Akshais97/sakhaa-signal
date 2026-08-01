import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { workspace: ws } = await getAuthenticatedSession();
    const jobs = await prisma.analysisJob.findMany({
      where: { workspaceId: ws.id },
      orderBy: { createdAt: "desc" },
      include: {
        stages: true,
        categoryScores: true,
      },
    });

    return NextResponse.json({ jobs, workspace: ws });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch analysis jobs", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace: ws } = await getAuthenticatedSession();
    const body = await req.json();
    const {
      mode,
      inputArtifactId,
      inputObjectKey,
      mediaType,
      title,
      brandName,
      targetPlatform,
      placement,
      creativeGoal,
      selectedModel,
    } = body;

    if (!mode || !inputArtifactId || !inputObjectKey || !mediaType) {
      return NextResponse.json(
        { error: "Missing required parameters: mode, inputArtifactId, inputObjectKey, mediaType" },
        { status: 400 }
      );
    }

    const jobId = crypto.randomUUID();

    const stagesList = mode === "STATIC_STANDARD"
      ? [
          "DOWNLOAD_AND_VALIDATE",
          "PREPROCESSING",
          "COMPUTER_VISION",
          "RULE_EVALUATION",
          "DETERMINISTIC_SCORING",
          "MULTIMODAL_GPT_SYNTHESIS",
          "REPORT_PUBLISHING",
        ]
      : [
          "DOWNLOAD_AND_VALIDATE",
          "FFMPEG_EXTRACTION",
          "COMPUTER_VISION",
          "GROQ_WHISPER_TRANSCRIPTION",
          "YAMNET_CLASSIFICATION",
          "RULE_EVALUATION",
          "DETERMINISTIC_SCORING",
          "MULTIMODAL_GPT_SYNTHESIS",
          "REPORT_PUBLISHING",
        ];

    const job = await prisma.analysisJob.create({
      data: {
        id: jobId,
        workspaceId: ws.id,
        mode,
        status: "QUEUED",
        currentStage: "QUEUED",
        progressPercent: 0,
        inputArtifactId,
        inputObjectKey,
        mediaType,
        title: title || `${brandName || "Ad"} Creative Analysis`,
        brandName,
        targetPlatform,
        placement,
        creativeGoal,
        selectedModel: selectedModel || null,
        stages: {
          create: stagesList.map((stageName, idx) => ({
            stageName,
            stageOrder: idx + 1,
            status: "QUEUED",
          })),
        },
      },
      include: {
        stages: {
          orderBy: { stageOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("[CREATE_ANALYSIS_JOB_ERROR]", error);
    return NextResponse.json({ error: "Failed to create analysis job", details: error.message }, { status: 500 });
  }
}
