import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { workspace: ws } = await getAuthenticatedSession();
    const jobs = await prisma.job.findMany({
      where: {
        workspaceId: ws.id,
        type: "TRIBEV2_AD_SCORER",
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedJobs = jobs.map(job => {
      const j = { ...job };
      if (j.status === "SUCCEEDED") {
        j.status = "COMPLETED" as any;
      }
      return j;
    });

    const res = NextResponse.json({ jobs: mappedJobs, workspace: ws });
    // Set cookie if not set
    const cookieStore = await cookies();
    if (!cookieStore.get("workspace-id") || cookieStore.get("workspace-id")?.value !== ws.id) {
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
    const { workspace: ws } = await getAuthenticatedSession();
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
