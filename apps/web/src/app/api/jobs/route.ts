import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { createServerClient } from "@supabase/ssr";

// Helper to get authenticated user and active workspace
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

  // Ensure user exists in our local Prisma users table
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
        status: "ACTIVE",
      },
    });
  }

  // Get active workspace cookie if set
  let workspaceId = cookieStore.get("workspace-id")?.value;
  let ws = null;

  if (workspaceId) {
    ws = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        status: "ACTIVE",
        memberships: { some: { userId: user.id } }
      },
    });
  }

  // If no workspace is active/authorized, get the first workspace membership
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

  // If still no workspace, dynamically seed a default one for this user
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
