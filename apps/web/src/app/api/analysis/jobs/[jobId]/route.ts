import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db";
import { createServerClient } from "@supabase/ssr";

async function getAuthenticatedSession() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized: Session not found");
  }

  return { user };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { user } = await getAuthenticatedSession();
    const { jobId } = await params;

    const job = await prisma.analysisJob.findUnique({
      where: { id: jobId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            memberships: {
              where: { userId: user.id },
            },
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

    if (!job || job.workspace.memberships.length === 0) {
      return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch analysis job", details: error.message },
      { status: 500 }
    );
  }
}
