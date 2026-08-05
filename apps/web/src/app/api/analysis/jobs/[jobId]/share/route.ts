import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { user, workspace: ws } = await getAuthenticatedSession();
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const job = await prisma.analysisJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.workspaceId !== ws.id) {
      return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.reportShareLink.create({
      data: {
        analysisJobId: jobId,
        workspaceId: ws.id,
        tokenHash,
        expiresAt,
        createdById: user.id,
      },
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/share/${rawToken}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      expiresAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create share link", details: error.message }, { status: 500 });
  }
}
