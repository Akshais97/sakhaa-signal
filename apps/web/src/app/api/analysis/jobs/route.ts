import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";
import { getAnalysisStages, INITIAL_ANALYSIS_JOB_STATE, isAllowedAnalysisModel, isStandardAnalysisMode } from "@sakhaa-forge/contracts";

export async function GET(req: NextRequest) {
  try {
    const { user, workspace }: any = await getAuthenticatedSession();
    const ws: any = workspace;
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
    const { user, workspace }: any = await getAuthenticatedSession();
    const ws: any = workspace;
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      mode,
      inputArtifactId,
      mediaType,
      title,
      brandName,
      targetPlatform,
      placement,
      creativeGoal,
      selectedModel,
    } = body;

    if (!mode || !inputArtifactId || !mediaType) {
      return NextResponse.json(
        { error: "Missing required parameters: mode, inputArtifactId, mediaType" },
        { status: 400 }
      );
    }

    if (!isStandardAnalysisMode(mode)) {
      return NextResponse.json({ error: "Unsupported analysis mode" }, { status: 400 });
    }
    let model = (selectedModel || "gpt-4o").toLowerCase().trim();
    if (model === "5.6 sol" || model === "5.6-sol" || model === "sol") {
      model = "gpt-5.6-sol";
    }

    if (!isAllowedAnalysisModel(model)) {
      return NextResponse.json({ error: `Unsupported analysis model: ${selectedModel}` }, { status: 400 });
    }
    let artifact = null;
    try {
      artifact = await prisma.artifact.findFirst({ where: { id: inputArtifactId } });
    } catch {}

    const objectKey = artifact?.objectKey || `workspaces/${ws.id}/analyses/${inputArtifactId}/input_media`;

    // Auto-ensure Workspace record exists in DB to satisfy foreign key constraint
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (ws?.id && UUID_REGEX.test(ws.id)) {
      try {
        await prisma.workspace.upsert({
          where: { id: ws.id },
          update: {},
          create: {
            id: ws.id,
            name: ws.name || "Default Workspace",
            slug: ws.slug || `ws-${ws.id.substring(0, 8)}`,
          },
        });
      } catch {}
    }

    const jobId = crypto.randomUUID();
    const stagesList = getAnalysisStages(mode);

    // If inputArtifactId does not exist in artifacts table, auto-create a clean record
    if (!artifact && UUID_REGEX.test(inputArtifactId) && UUID_REGEX.test(ws.id)) {
      try {
        await prisma.artifact.create({
          data: {
            id: inputArtifactId,
            workspaceId: ws.id,
            fileName: "input_media",
            contentType: mediaType.toLowerCase() === "video" ? "video/mp4" : "image/jpeg",
            byteSize: 1024,
            sha256: "0".repeat(64),
            status: "CLEAN",
            retentionClass: "ANALYSIS_INPUT",
            producer: "USER_UPLOAD",
            schemaVersion: "v1",
            objectKey,
          },
        });
      } catch {}
    }

    const job = await prisma.analysisJob.create({
      data: {
        id: jobId,
        workspaceId: ws.id,
        mode: mode || "STATIC_STANDARD",
        ...INITIAL_ANALYSIS_JOB_STATE,
        mediaType: mediaType || "IMAGE",
        inputArtifactId,
        inputObjectKey: objectKey,
        title: title || "Untitled Creative Analysis",
        brandName: brandName || null,
        targetPlatform: targetPlatform || null,
        placement: placement || null,
        creativeGoal: creativeGoal || null,
        selectedModel: model,
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
