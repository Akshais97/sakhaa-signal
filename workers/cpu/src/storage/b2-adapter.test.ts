import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { StorageAdapter } from "./b2-adapter.js";

test("downloadToLocal preserves B2 authorization failures instead of reporting a missing object", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sakhaa-b2-adapter-"));
  const forbidden = Object.assign(new Error("UnknownError"), {
    name: "Unknown",
    $metadata: { httpStatusCode: 403 },
  });
  const adapter = new StorageAdapter({
    provider: "b2",
    s3Client: { send: async () => Promise.reject(forbidden) },
  });

  try {
    await assert.rejects(
      adapter.downloadToLocal("workspaces/test/input.mp4", path.join(tempDir, "input.mp4")),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /HTTP 403/);
        assert.doesNotMatch(error.message, /not found in S3\/B2 or local storage/);
        return true;
      },
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("downloadToLocal retains the local simulator fallback for a genuine B2 404", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sakhaa-b2-adapter-"));
  const missing = Object.assign(new Error("Not Found"), {
    name: "NotFound",
    $metadata: { httpStatusCode: 404 },
  });
  const adapter = new StorageAdapter({
    provider: "b2",
    s3Client: { send: async () => Promise.reject(missing) },
  });

  try {
    await assert.rejects(
      adapter.downloadToLocal("workspaces/test/missing.mp4", path.join(tempDir, "input.mp4")),
      /not found in S3\/B2 or local storage/,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
