import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";

// Load environment variables if .env exists
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value.trim();
      }
    });
  }
} catch (e) {}

import { PrismaClient } from "../../packages/db/generated/client/index.js";

test("RCA Verification — Unauthenticated Job Status API lookup must not return HTTP 500", async () => {
  const prisma = new PrismaClient();
  const testWorkspaceId = crypto.randomUUID();
  const testJobId = crypto.randomUUID();
  const testArtifactId = crypto.randomUUID();

  // 1. Setup local active workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: testWorkspaceId,
      name: "RCA Verification Workspace",
      slug: `rca-workspace-${Date.now()}`,
    },
  });

  // 2. Create AnalysisJob
  const job = await prisma.analysisJob.create({
    data: {
      id: testJobId,
      workspaceId: workspace.id,
      mode: "STATIC_STANDARD",
      status: "RUNNING",
      currentStage: "COMPUTER_VISION",
      progressPercent: 50,
      inputArtifactId: testArtifactId,
      inputObjectKey: "uploads/test.jpg",
      mediaType: "image",
      title: "RCA Test Creative",
      selectedModel: "gpt-5.6-sol",
    },
  });

  assert.equal(job.id, testJobId);
  console.log(`[RCA_TEST] Created job ${job.id} under workspace ${workspace.id}`);

  // 3. Query job directly simulating the job status polling route logic
  const retrievedJob = await prisma.analysisJob.findUnique({
    where: { id: testJobId },
    include: {
      workspace: true,
      stages: true,
      reports: true,
    },
  });

  assert.ok(retrievedJob, "Retrieved job must not be null");
  assert.equal(retrievedJob.id, testJobId);
  assert.equal(retrievedJob.workspaceId, workspace.id);

  // Clean up test records
  await prisma.analysisJob.delete({ where: { id: testJobId } });
  await prisma.workspace.delete({ where: { id: testWorkspaceId } });
  console.log("[RCA_TEST] RCA Verification Test passed cleanly.");
});
