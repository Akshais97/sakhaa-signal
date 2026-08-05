import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";
import { getAnalysisStages, INITIAL_ANALYSIS_JOB_STATE } from "@/lib/analysis-job-config";

export async function GET(req: NextRequest) {
  try {
    const { user, workspace: ws } = await getAuthenticatedSession();
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const { user, workspace: ws } = await getAuthenticatedSession();
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const stagesList = getAnalysisStages(mode);

    const job = await prisma.analysisJob.create({
      data: {
        id: jobId,
        workspaceId: ws.id,
        mode: mode || "STATIC_STANDARD",
        ...INITIAL_ANALYSIS_JOB_STATE,
        mediaType: mediaType || "IMAGE",
        inputArtifactId,
        inputObjectKey,
        title: title || "Untitled Creative Analysis",
        brandName: brandName || null,
        targetPlatform: targetPlatform || null,
        placement: placement || null,
        creativeGoal: creativeGoal || null,
        selectedModel: selectedModel || "gpt-4o",
        stages: {
          create: stagesList.map((stageName, index) => ({
            stageName,
            stageOrder: index + 1,
            status: "QUEUED" as const,
          })),
        },
      },
      include: {
        stages: true,
      },
    });

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("[POST_ANALYSIS_JOB_ERROR]", error);
    return NextResponse.json({ error: "Failed to create analysis job", details: error.message }, { status: 500 });
  }
}
