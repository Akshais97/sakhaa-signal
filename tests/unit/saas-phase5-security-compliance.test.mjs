import test from "node:test";
import assert from "node:assert/strict";
import { validateUploadMetadata } from "../../apps/web/src/lib/uploadSanitizer.ts";
import { checkRateLimit } from "../../apps/web/src/lib/rateLimit.ts";

test("Phase 5: Upload Quarantine Sanitizer validates image and video MIME types & sizes", () => {
  // Valid image
  const validImg = validateUploadMetadata("banner.png", "image/png", 5 * 1024 * 1024, "IMAGE");
  assert.equal(validImg.valid, true);

  // Invalid image MIME
  const invalidMime = validateUploadMetadata("script.exe", "application/x-msdownload", 1000, "IMAGE");
  assert.equal(invalidMime.valid, false);
  assert.equal(invalidMime.error?.includes("Unsupported content type"), true);

  // Oversized video
  const oversizedVideo = validateUploadMetadata("ad.mp4", "video/mp4", 500 * 1024 * 1024, "VIDEO");
  assert.equal(oversizedVideo.valid, false);
  assert.equal(oversizedVideo.error?.includes("exceeds the 300MB limit"), true);
});

test("Phase 5: Sliding Window Rate Limiter blocks excessive requests", () => {
  const testKey = "user_test_rate_limit_1";
  const limit = 3;
  const windowMs = 10000;

  assert.equal(checkRateLimit(testKey, limit, windowMs).allowed, true);
  assert.equal(checkRateLimit(testKey, limit, windowMs).allowed, true);
  assert.equal(checkRateLimit(testKey, limit, windowMs).allowed, true);

  // 4th request exceeds limit of 3
  assert.equal(checkRateLimit(testKey, limit, windowMs).allowed, false);
});
