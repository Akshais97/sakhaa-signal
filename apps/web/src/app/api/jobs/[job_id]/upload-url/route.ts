import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await params;

    const job = await prisma.job.findUnique({
      where: { id: job_id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const objectKey = `uploads/${job_id}/original_video.mp4`;
    // In local development, the browser will upload directly to our mock storage API route
    const uploadUrl = `${req.nextUrl.origin}/api/storage/upload?key=${objectKey}`;

    return NextResponse.json({ uploadUrl, objectKey });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: error.message },
      { status: 500 }
    );
  }
}
