import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  const { job_id } = await params;
  try {

    const job = await prisma.job.findUnique({
      where: { id: job_id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Prepare GPU payload and append dynamic callback url
    const callbackUrl = `${req.nextUrl.origin}/api/jobs/${job_id}/callback`;
    const payload = {
      ...(job.input as any),
      callback_url: callbackUrl,
    };

    // Load worker security token (default to local dev fallback)
    const workerToken = process.env.GPU_WORKER_TOKEN || "dev-worker-token-123";
    const gpuWorkerUrl = process.env.GPU_WORKER_URL || "http://localhost:8000";

    console.log(`[CONTROL API] Forwarding job ${job_id} to GPU worker at ${gpuWorkerUrl}... Callback URL: ${callbackUrl}`);

    const response = await fetch(`${gpuWorkerUrl}/api/gpu/jobs/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${workerToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GPU worker rejected request: ${response.status} ${errText}`);
    }

    const result = await response.json();

    // Update job status in database to QUEUED
    const updatedJob = await prisma.job.update({
      where: { id: job_id },
      data: {
        status: "QUEUED",
      },
    });

    return NextResponse.json({ success: true, job: updatedJob, workerResponse: result });
  } catch (error: any) {
    console.error(`[CONTROL API] Failed to start job ${job_id}:`, error);
    return NextResponse.json(
      { error: "Failed to start job on GPU worker", details: error.message },
      { status: 500 }
    );
  }
}
