import { cache } from "react";
import prisma from "./db";
import { getAuthenticatedSession } from "./auth";

/**
 * Ensures the requesting user has a valid PlatformAdmin role (SUPER_ADMIN, SUPPORT, OPERATIONS, FINANCE).
 * Cached per request to eliminate duplicate authentication network roundtrips during tab navigation.
 */
const safeCache = typeof cache === "function" ? cache : <T extends (...args: any[]) => any>(fn: T) => fn;

export const requirePlatformAdminSession = safeCache(async () => {
  const session = await getAuthenticatedSession();

  if (!session.user) {
    return { isAuthorized: false, user: null, adminRecord: null };
  }

  const adminRecord = await prisma.platformAdmin.findUnique({
    where: { userId: session.user.id },
  });

  // In development, if dev bypass is active or super admin fallback exists, allow access
  const isDevBypassAllowed =
    process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_BYPASS === "true";

  if (!adminRecord && !isDevBypassAllowed) {
    return { isAuthorized: false, user: session.user, adminRecord: null };
  }

  return {
    isAuthorized: true,
    user: session.user,
    adminRecord: adminRecord || { role: "SUPER_ADMIN" },
  };
});
