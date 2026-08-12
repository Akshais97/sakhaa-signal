import { NextRequest, NextResponse } from "next/server";
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
    const artifact = await prisma.artifact.findFirst({
      where: { id: inputArtifactId, workspaceId: ws.id },
    });
    if (!artifact) {
      return NextResponse.json({ error: "Upload artifact not found" }, { status: 404 });
    }
    if (artifact.status !== "CLEAN") {
      return NextResponse.json({ error: "Upload has not been verified" }, { status: 409 });
    }
    const expectedMediaType = String(mediaType).toLowerCase() === "video" ? "video" : "image";
    if (!artifact.contentType.toLowerCase().startsWith(`${expectedMediaType}/`)) {
      return NextResponse.json({ error: "Artifact media type does not match the job" }, { status: 400 });
    }

    const stagesList = getAnalysisStages(mode);

    try {
      const job = await prisma.analysisJob.create({
        data: {
          workspaceId: ws.id,
          mode: mode || "STATIC_STANDARD",
          ...INITIAL_ANALYSIS_JOB_STATE,
          mediaType: mediaType || "IMAGE",
          inputArtifactId: artifact.id,
          inputObjectKey: artifact.objectKey,
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
    } catch (error) {
      console.error("[POST_ANALYSIS_JOB_PERSISTENCE_ERROR]", error);
      return NextResponse.json(
        { error: "Analysis job could not be persisted", code: "JOB_PERSISTENCE_FAILED" },
        { status: 503 },
      );
    }
  } catch (error: any) {
    console.error("[POST_ANALYSIS_JOB_ERROR]", error);
    return NextResponse.json({ error: "Failed to create analysis job", details: error.message }, { status: 500 });
  }
}
