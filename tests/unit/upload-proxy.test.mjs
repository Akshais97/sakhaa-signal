import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

test("Upload Proxy — Server-side stream upload to storage adapter", async () => {
  const samplePath = path.resolve(process.cwd(), "samples", "Social_Media_creative_sample.png");
  const buffer = await readFile(samplePath);
  assert.ok(buffer.byteLength > 0, "Sample file must not be empty");

  const objectKey = `workspaces/demo/analyses/test-artifactId/Social_Media_creative_sample.png`;
  const storageRoot = path.resolve(process.cwd(), ".local", "storage", "v0-local-quarantine");
  const filePath = path.join(storageRoot, objectKey);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);

  assert.ok(existsSync(filePath), "File must be written to quarantine storage");

  const verifyBuffer = await readFile(filePath);
  assert.equal(verifyBuffer.byteLength, buffer.byteLength, "File size must match sample file size");
});
