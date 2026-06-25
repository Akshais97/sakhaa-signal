import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import prisma from "@/lib/db";

// Helper to get active workspace or seed default
async function getOrCreateActiveWorkspace() {
  const cookieStore = await cookies();
  let workspaceId = cookieStore.get("workspace-id")?.value;

  if (workspaceId) {
    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (ws) return ws;
  }

  // Fallback: check if any workspace exists
  let ws = await prisma.workspace.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!ws) {
    // Seed default user & workspace
    const userId = crypto.randomUUID();
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: "demo-user@tribev2.local",
        displayName: "Demo User",
      },
    });

    ws = await prisma.workspace.create({
      data: {
        name: "Demo Workspace",
        slug: "demo-workspace",
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });
  }

  return ws;
}

export async function GET(req: NextRequest) {
  try {
    const ws = await getOrCreateActiveWorkspace();
    const jobs = await prisma.job.findMany({
      where: {
        workspaceId: ws.id,
        type: "TRIBEV2_AD_SCORER",
      },
      orderBy: { createdAt: "desc" },
    });

    const res = NextResponse.json({ jobs, workspace: ws });
    // Set cookie if not set
    const cookieStore = await cookies();
    if (!cookieStore.get("workspace-id")) {
      res.cookies.set("workspace-id", ws.id, { path: "/" });
    }
    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to list jobs", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ws = await getOrCreateActiveWorkspace();
    const body = await req.json();

    const {
      project_name,
      video_name,
      video_object_key,
      cluster_mode = "both",
      output_mode = "full_export",
      run_llm_explanation = true,
      brand_name = "optional",
      campaign_name = "optional",
      target_audience = "optional",
      creative_objective = "optional"
    } = body;

    if (!project_name || !video_name || !video_object_key) {
      return NextResponse.json(
        { error: "Missing required fields: project_name, video_name, video_object_key" },
        { status: 400 }
      );
    }

    const job_id = crypto.randomUUID();
    const jobPayload = {
      job_id,
      video_object_key,
      project_name,
      video_name,
      cluster_mode,
      output_mode,
      run_llm_explanation,
      brand_name,
      campaign_name,
      target_audience,
      creative_objective
    };

    // Calculate sha256 input hash for idempotency validation
    const inputHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(jobPayload))
      .digest("hex");

    const job = await prisma.job.create({
      data: {
        id: job_id,
        workspaceId: ws.id,
        type: "TRIBEV2_AD_SCORER",
        resourceClass: "gpu",
        status: "CREATED",
        inputHash,
        input: jobPayload,
      },
    });

    return NextResponse.json({ job });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create job", details: error.message },
      { status: 500 }
    );
  }
}
