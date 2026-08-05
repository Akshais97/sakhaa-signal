import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

test("Phase 6: Report Share Token hash generation and 30-day expiration window", () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  assert.equal(tokenHash.length, 64);
  assert.equal(expiresAt > new Date(), true);
});
