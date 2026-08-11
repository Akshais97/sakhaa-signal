import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import prisma from "./db";

const EMAIL_ROLE_MAPPING: Record<
  string,
  { role: "OWNER" | "ADMIN" | "CLIENT_MANAGER" | "REVIEWER"; isPlatformAdmin: boolean }
> = {
  "akshaiofficial97@gmail.com": { role: "OWNER", isPlatformAdmin: true },
  "akshairofficial@gmail.com": { role: "ADMIN", isPlatformAdmin: false },
  "roxx.akshai@gmail.com": { role: "CLIENT_MANAGER", isPlatformAdmin: false },
  "akshaiindia97@gmail.com": { role: "REVIEWER", isPlatformAdmin: false },
};

/**
 * Retrieves the current authenticated user and workspace session.
 * Wrapped with React cache() to eliminate duplicate Supabase Auth network roundtrips during Next.js rendering.
 */
export const getAuthenticatedSession = cache(async () => {
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
            cookiesToSet.forEach(({ name, value, options }: any) =>
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

  const isDevBypassAllowed =
    process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_BYPASS === "true";

  // If unauthenticated and dev bypass is not enabled, return null session
  if (!user) {
    if (!isDevBypassAllowed) {
      return { user: null, workspace: null };
    }

    // Dev bypass only for local development testing when explicitly enabled
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

    // Provision once; avoid rewriting the same user on every dashboard poll.
    const devUser = await prisma.user.findUnique({
      where: { id: "local-dev-user" },
      select: { email: true, displayName: true },
    });
    if (!devUser) {
      await prisma.user.upsert({
        where: { id: "local-dev-user" },
        update: {},
        create: { id: "local-dev-user", email: "dev@local.internal", displayName: "Local Dev User" },
      });
    } else if (devUser.email !== "dev@local.internal" || devUser.displayName !== "Local Dev User") {
      await prisma.user.update({
        where: { id: "local-dev-user" },
        data: { email: "dev@local.internal", displayName: "Local Dev User" },
      });
    }

    return { user: { id: "local-dev-user", email: "dev@local.internal", isPlatformAdmin: true }, workspace: ws };
  }

  // Ensure the auth identity exists locally, but only write when it changed.
  const incomingEmail = user.email || null;
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true },
  });
  if (!existingUser) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: incomingEmail,
        displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || null,
      },
    });
  } else if (existingUser.email !== incomingEmail) {
    await prisma.user.update({
      where: { id: user.id },
      data: { email: incomingEmail },
    });
  }

  const emailLower = user.email?.toLowerCase() || "";
  const roleConfig = EMAIL_ROLE_MAPPING[emailLower];

  // Auto-provision PlatformAdmin if email is marked as platform admin
  let platformAdminRecord = null;
  if (roleConfig?.isPlatformAdmin) {
    platformAdminRecord = await prisma.platformAdmin.findUnique({
      where: { userId: user.id },
    });
    if (!platformAdminRecord) {
      platformAdminRecord = await prisma.platformAdmin.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, role: "SUPER_ADMIN", status: "ACTIVE" },
      });
    } else if (platformAdminRecord.role !== "SUPER_ADMIN" || platformAdminRecord.status !== "ACTIVE") {
      platformAdminRecord = await prisma.platformAdmin.update({
        where: { userId: user.id },
        data: { role: "SUPER_ADMIN", status: "ACTIVE" },
      });
    }
  } else {
    platformAdminRecord = await prisma.platformAdmin.findUnique({
      where: { userId: user.id },
    });
  }

  const isPlatformAdmin = !!platformAdminRecord || !!roleConfig?.isPlatformAdmin;

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
      // Sync membership role if configured specifically for this email
      if (roleConfig && membership.role !== roleConfig.role) {
        await prisma.membership.update({
          where: { id: membership.id },
          data: { role: roleConfig.role },
        });
      }
    }
  }

  if (!ws) {
    const name = `${user.email?.split("@")[0] || "User"}'s Workspace`;
    const slug = `workspace-${user.id.substring(0, 8)}`;
    const assignedRole = roleConfig?.role || "OWNER";

    ws = await prisma.workspace.create({
      data: {
        name,
        slug,
        memberships: {
          create: {
            userId: user.id,
            role: assignedRole,
          },
        },
      },
    });
  }

  const userPayload = {
    ...user,
    isPlatformAdmin,
  };

  return { user: userPayload, workspace: ws };
});
