import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { JobStatus } from "@sakhaa-forge/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await params;

    // 1. Authenticate the request from the GPU worker
    const authHeader = req.headers.get("Authorization");
    const expectedToken = process.env.GPU_WORKER_TOKEN || "dev-worker-token-123";
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // 2. Parse the progress payload
    const body = await req.json();
    const { status: workerStatus, error_message, manifest } = body;

    if (!workerStatus) {
      return NextResponse.json({ error: "Missing worker status in payload" }, { status: 400 });
    }

    // 3. Find the job in the database
    const job = await prisma.job.findUnique({
      where: { id: job_id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Don't overwrite terminal states if already finished
    if (job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "CANCELLED") {
      return NextResponse.json({ 
        message: "Job already in a terminal state. Skipping callback update.",
        currentStatus: job.status
      });
    }

    // 4. Map worker state to Prisma JobStatus
    let dbStatus: any = job.status;
    let lastErrorCode = job.lastErrorCode;

    if (workerStatus === "COMPLETED") {
      dbStatus = "SUCCEEDED";
    } else if (workerStatus === "FAILED") {
      dbStatus = "FAILED";
      lastErrorCode = error_message || "UNKNOWN_GPU_ERROR";
    } else if (workerStatus === "CANCELLED") {
      dbStatus = "CANCELLED";
    } else {
      // Any other intermediate state (e.g. RECEIVED, VALIDATING, ENCODING_VIDEO, etc.)
      dbStatus = "RUNNING";
    }

    console.log(`[CALLBACK WEBHOOK] Job ${job_id} status update: ${job.status} -> ${dbStatus} (Worker state: ${workerStatus})`);

    // 5. Update the job status in the database
    const updatedJob = await prisma.job.update({
      where: { id: job_id },
      data: {
        status: dbStatus,
        lastErrorCode,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Job status successfully updated to ${dbStatus}`,
      job: updatedJob 
    });

  } catch (error: any) {
    console.error("[CALLBACK WEBHOOK ERROR] Failed to process status update:", error);
    return NextResponse.json(
      { error: "Webhook callback processing failed", details: error.message },
      { status: 500 }
    );
  }
}
