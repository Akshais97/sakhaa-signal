import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { loadApiEnv } from "../helpers/env.mjs";
import { PrismaClient } from "../../packages/db/generated/client/index.js";

loadApiEnv();

test("Database Schema — AnalysisJob creation with ordered AnalysisStage records", async () => {
  const prisma = new PrismaClient();
  const testWorkspaceId = crypto.randomUUID();

  // 1. Create temporary test workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: testWorkspaceId,
      name: "TDD Test Workspace",
      slug: `tdd-workspace-${Date.now()}`,
    },
  });
  assert.equal(workspace.id, testWorkspaceId);

  const testJobId = crypto.randomUUID();
  const testArtifactId = crypto.randomUUID();

  // 2. Create AnalysisJob with stages including stageOrder
  const stagesList = [
    "DOWNLOAD_AND_VALIDATE",
    "PREPROCESSING",
    "COMPUTER_VISION",
    "RULE_EVALUATION",
    "DETERMINISTIC_SCORING",
    "MULTIMODAL_GPT_SYNTHESIS",
    "REPORT_PUBLISHING",
  ];

  const job = await prisma.analysisJob.create({
    data: {
      id: testJobId,
      workspaceId: workspace.id,
      mode: "STATIC_STANDARD",
      status: "QUEUED",
      currentStage: "QUEUED",
      progressPercent: 0,
      inputArtifactId: testArtifactId,
      inputObjectKey: `workspaces/${workspace.id}/analyses/${testArtifactId}/sample.png`,
      mediaType: "image",
      title: "TDD Static Analysis",
      brandName: "TDD Brand",
      targetPlatform: "INSTAGRAM_REELS",
      placement: "REEL",
      creativeGoal: "Conversion",
      stages: {
        create: stagesList.map((stageName, idx) => ({
          stageName,
          stageOrder: idx + 1,
          status: "QUEUED",
        })),
      },
    },
    include: {
      stages: {
        orderBy: { stageOrder: "asc" },
      },
    },
  });

  assert.equal(job.id, testJobId);
  assert.equal(job.stages.length, 7);
  assert.equal(job.stages[0].stageOrder, 1);
  assert.equal(job.stages[6].stageOrder, 7);

  // Clean up test records
  await prisma.analysisJob.delete({ where: { id: testJobId } });
  await prisma.workspace.delete({ where: { id: testWorkspaceId } });
});
