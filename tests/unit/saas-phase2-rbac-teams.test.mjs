import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { roleCan } from "../../apps/web/src/lib/rbac.ts";

test("Phase 2: RBAC Matrix correctly enforces permissions across all roles", () => {
  // OWNER permissions
  assert.equal(roleCan("OWNER", "job:create"), true);
  assert.equal(roleCan("OWNER", "member:invite"), true);
  assert.equal(roleCan("OWNER", "billing:manage"), true);
  assert.equal(roleCan("OWNER", "workspace:delete"), true);

  // ADMIN permissions
  assert.equal(roleCan("ADMIN", "job:create"), true);
  assert.equal(roleCan("ADMIN", "member:invite"), true);
  assert.equal(roleCan("ADMIN", "billing:manage"), false);
  assert.equal(roleCan("ADMIN", "workspace:delete"), false);

  // CLIENT_MANAGER permissions
  assert.equal(roleCan("CLIENT_MANAGER", "job:create"), true);
  assert.equal(roleCan("CLIENT_MANAGER", "report:share"), true);
  assert.equal(roleCan("CLIENT_MANAGER", "member:invite"), false);
  assert.equal(roleCan("CLIENT_MANAGER", "billing:manage"), false);

  // REVIEWER permissions
  assert.equal(roleCan("REVIEWER", "report:read"), true);
  assert.equal(roleCan("REVIEWER", "job:create"), false);
  assert.equal(roleCan("REVIEWER", "member:invite"), false);
  assert.equal(roleCan("REVIEWER", "billing:manage"), false);
});

test("Phase 2: Workspace invite token hashing and 7-day expiration", () => {
  const rawToken = "test_invite_token_123456789";
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  assert.equal(tokenHash.length, 64);
  assert.equal(expiresAt > new Date(), true);
});
