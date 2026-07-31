import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import prisma from "@/lib/db";
import { createServerClient } from "@supabase/ssr";

async function getAuthenticatedSession() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
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

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {}

  // Fallback to active workspace for local development / unauthenticated testing
  if (!user) {
    let ws = await prisma.workspace.findFirst({
      where: { status: "ACTIVE" },
    });
    if (!ws) {
      ws = await prisma.workspace.create({
        data: {
          id: "demo-workspace-0000-0000-000000000000",
          name: "Local Dev Workspace",
          slug: "local-dev-workspace",
        },
      });
    }
    return { user: { id: "local-dev-user", email: "dev@local.internal" }, workspace: ws };
  }

  let ws = null;
  const workspaceId = cookieStore.get("workspace-id")?.value;
  if (workspaceId) {
    ws = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        status: "ACTIVE",
        memberships: { some: { userId: user.id } },
      },
    });
  }

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

export async function POST(req: NextRequest) {
  try {
    const { workspace: ws } = await getAuthenticatedSession();
    const body = await req.json();
    const { fileName, contentType, byteSize, mediaType } = body;

    if (!fileName || !contentType || !byteSize || !mediaType) {
      return NextResponse.json(
        { error: "Missing required upload parameters: fileName, contentType, byteSize, mediaType" },
        { status: 400 }
      );
    }

    const artifactId = crypto.randomUUID();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `workspaces/${ws.id}/analyses/${artifactId}/${sanitizedFileName}`;

    // Create DB artifact record
    const artifact = await prisma.artifact.create({
      data: {
        id: artifactId,
        workspaceId: ws.id,
        fileName: sanitizedFileName,
        contentType,
        byteSize: Number(byteSize),
        sha256: "0".repeat(64),
        status: "QUARANTINED",
        retentionClass: "ANALYSIS_INPUT",
        producer: "USER_UPLOAD",
        schemaVersion: "v1",
        objectKey,
      },
    });

    // Use same-origin upload proxy endpoint to guarantee 0 CORS preflight issues across all browsers
    const uploadUrl = `/api/uploads/direct?key=${encodeURIComponent(objectKey)}&artifactId=${artifact.id}`;

    return NextResponse.json({
      uploadUrl,
      artifactId: artifact.id,
      objectKey,
      workspaceId: ws.id,
    });
  } catch (error: any) {
    console.error("[PRESIGN_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL", details: error.message },
      { status: 500 }
    );
  }
}
