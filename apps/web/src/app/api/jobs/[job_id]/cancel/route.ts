import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { user, workspace: ws } = await getAuthenticatedSession();
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { job_id } = await params;

    const job = await prisma.job.findUnique({
      where: { id: job_id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.workspaceId !== ws.id && !user.isPlatformAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "CANCELLED") {
      return NextResponse.json({ error: "Job is already completed, failed, or cancelled" }, { status: 400 });
    }

    const gpuWorkerUrl = process.env.GPU_WORKER_URL || "http://localhost:8080";
    const workerToken = process.env.GPU_WORKER_TOKEN || "dev-worker-token-123";

    // Call the GPU worker to cancel
    try {
      await fetch(`${gpuWorkerUrl}/api/gpu/jobs/${job_id}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${workerToken}`,
        },
      });
    } catch (err) {
      console.error("[CONTROL API] Failed to forward cancellation to GPU worker:", err);
    }

    // Update database status to CANCELLED
    const updatedJob = await prisma.job.update({
      where: { id: job_id },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to cancel job", details: error.message },
      { status: 500 }
    );
  }
}
