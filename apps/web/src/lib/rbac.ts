import { MembershipRole } from "@sakhaa-forge/db";

export type Permission =
  | "job:create"
  | "job:read"
  | "job:cancel"
  | "job:delete"
  | "report:read"
  | "report:export"
  | "report:share"
  | "member:invite"
  | "member:update_role"
  | "member:remove"
  | "billing:manage"
  | "workspace:update"
  | "workspace:delete"
  | "audit:read"
  | "admin:access";

const ROLE_PERMISSIONS: Record<MembershipRole, Permission[]> = {
  OWNER: [
    "job:create",
    "job:read",
    "job:cancel",
    "job:delete",
    "report:read",
    "report:export",
    "report:share",
    "member:invite",
    "member:update_role",
    "member:remove",
    "billing:manage",
    "workspace:update",
    "workspace:delete",
    "audit:read",
  ],
  ADMIN: [
    "job:create",
    "job:read",
    "job:cancel",
    "job:delete",
    "report:read",
    "report:export",
    "report:share",
    "member:invite",
    "member:update_role",
    "member:remove",
    "workspace:update",
    "audit:read",
  ],
  CLIENT_MANAGER: [
    "job:create",
    "job:read",
    "job:cancel",
    "report:read",
    "report:export",
    "report:share",
  ],
  REVIEWER: [
    "job:read",
    "report:read",
  ],
};

/**
 * Evaluates whether a workspace role possesses the requested permission.
 */
export function roleCan(role: MembershipRole, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Server-side guard to throw or return unauthorized error if permission is missing.
 */
export function requirePermission(
  userRole: MembershipRole | undefined | null,
  permission: Permission
): void {
  if (!userRole || !roleCan(userRole, permission)) {
    throw new Error(`Forbidden: Role '${userRole || "ANONYMOUS"}' lacks required permission '${permission}'`);
  }
}
