import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import prisma from "./db";

export async function getAuthenticatedSession() {
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
