import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { user, workspace: ws } = await getAuthenticatedSession();
    const { jobId } = await params;

    const job = await prisma.analysisJob.findUnique({
      where: { id: jobId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        stages: {
          orderBy: { startedAt: "asc" },
        },
        evidence: true,
        ruleResults: true,
        categoryScores: true,
        findings: true,
        reports: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Access check: allow if job belongs to active workspace OR if user is a member of job's workspace
    const isWorkspaceMatch = job.workspaceId === ws.id;
    if (!isWorkspaceMatch) {
      const membership = await prisma.membership.findFirst({
        where: { workspaceId: job.workspaceId, userId: user.id },
      });
      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("[GET_ANALYSIS_JOB_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis job", details: error.message },
      { status: 500 }
    );
  }
}
