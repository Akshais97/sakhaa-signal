import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { createServerClient } from "@supabase/ssr";

async function getAuthenticatedSession() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {}

  // Fallback to active workspace for local development / unauthenticated testing
  if (!user) {
    let ws = await prisma.workspace.findFirst({
      where: { status: "ACTIVE" },
    });
    if (!ws) {
      ws = await prisma.workspace.create({
        data: {
          id: "demo-workspace-0000-0000-000000000000",
          name: "Local Dev Workspace",
          slug: "local-dev-workspace",
        },
      });
    }
    return { user: { id: "local-dev-user", email: "dev@local.internal" }, workspace: ws };
  }

  let ws = null;
  const workspaceId = cookieStore.get("workspace-id")?.value;
  if (workspaceId) {
    ws = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        status: "ACTIVE",
        memberships: { some: { userId: user.id } },
      },
    });
  }

  if (!ws) {
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        workspace: { status: "ACTIVE" },
      },
      include: { workspace: true },
    });
    if (membership) {
      ws = membership.workspace;
    }
  }

  if (!ws) {
    const name = `${user.email?.split("@")[0] || "User"}'s Workspace`;
    const slug = `workspace-${user.id.substring(0, 8)}`;
    ws = await prisma.workspace.create({
      data: {
        name,
        slug,
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });
  }

  return { user, workspace: ws };
}

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
