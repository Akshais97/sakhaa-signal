import "dotenv/config";
import dotenv from "dotenv";
import path from "node:path";
import os from "node:os";

// Ensure root .env is loaded
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { PrismaClient } from "@sakhaa-forge/db";
import { StorageAdapter } from "./storage/b2-adapter.js";
import {
  inspectImage,
  analyzeStaticImageWithVision,
  evaluateStaticRules,
  computeStaticCategoryScores,
  generateStaticSynthesis,
} from "@sakhaa-signal/engines";
import { readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const prisma = new PrismaClient();
const storage = new StorageAdapter();
const WORKER_ID = `cpu-worker-${os.hostname()}-${process.pid}`;
const POLL_INTERVAL_MS = 3000;

console.log(`[SIGNAL_CPU_WORKER] Started as ${WORKER_ID}`);

async function claimEligibleJob() {
  const now = new Date();
  const leaseDurationMs = 5 * 60 * 1000;
  const leaseExpiresAt = new Date(now.getTime() + leaseDurationMs);

  const eligible = await prisma.analysisJob.findFirst({
    where: {
      OR: [
        { status: "QUEUED" },
        { status: "LEASED", leaseExpiresAt: { lt: now } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (!eligible) return null;

  const updatedCount = await prisma.analysisJob.updateMany({
    where: {
      id: eligible.id,
      updatedAt: eligible.updatedAt,
    },
    data: {
      status: "LEASED",
      leaseOwner: WORKER_ID,
      leaseExpiresAt,
      currentStage: "CLAIMED",
      progressPercent: 5,
    },
  });

  if (updatedCount.count === 0) return null;

  return prisma.analysisJob.findUnique({
    where: { id: eligible.id },
    include: { stages: true },
  });
}

async function processJob(job: any) {
  console.log(`[SIGNAL_CPU_WORKER] Processing Job: ${job.id} (${job.mode} - ${job.mediaType})`);
  const tempDir = path.resolve(os.tmpdir(), "sakhaa-signal", job.id);

  try {
    // 1. Download & Validate Stage
    await updateStage(job.id, "DOWNLOAD_AND_VALIDATE", "RUNNING", 10);
    const localInputPath = path.join(tempDir, "input_media");
    await storage.downloadToLocal(job.inputObjectKey, localInputPath);
    await updateStage(job.id, "DOWNLOAD_AND_VALIDATE", "SUCCEEDED", 20);

    const imageBuffer = await readFile(localInputPath);

    // 2. Preprocessing Stage (Inspection)
    await updateStage(job.id, "PREPROCESSING", "RUNNING", 30);
    const inspection = await inspectImage(imageBuffer);
    await updateStage(job.id, "PREPROCESSING", "SUCCEEDED", 40);

    // 3. Computer Vision Stage
    await updateStage(job.id, "COMPUTER_VISION", "RUNNING", 50);
    const vision = await analyzeStaticImageWithVision(imageBuffer, inspection.width, inspection.height);

    // Store Evidence Observations in DB
    for (const obs of vision.observations) {
      await prisma.evidenceObservation.create({
        data: {
          analysisJobId: job.id,
          observationType: obs.observationType,
          label: obs.label,
          confidence: obs.confidence,
          boundingBox: obs.boundingBox ? (obs.boundingBox as any) : undefined,
          provider: obs.provider,
        },
      });
    }
    await updateStage(job.id, "COMPUTER_VISION", "SUCCEEDED", 65);

    // 4. Rule Evaluation Stage
    await updateStage(job.id, "RULE_EVALUATION", "RUNNING", 75);
    const rules = evaluateStaticRules(inspection, vision, {
      brandName: job.brandName,
      creativeGoal: job.creativeGoal,
    });

    for (const r of rules) {
      await prisma.ruleResult.create({
        data: {
          analysisJobId: job.id,
          ruleCode: r.ruleCode,
          status: r.status,
          expected: r.expected,
          actual: r.actual,
          severity: r.severity,
          evidenceIds: r.evidenceIds ? (r.evidenceIds as any) : undefined,
        },
      });
    }
    await updateStage(job.id, "RULE_EVALUATION", "SUCCEEDED", 80);

    // 5. Deterministic Scoring Stage
    await updateStage(job.id, "DETERMINISTIC_SCORING", "RUNNING", 85);
    const scoring = computeStaticCategoryScores(inspection, vision, rules);

    for (const cs of scoring.categoryScores) {
      await prisma.categoryScore.create({
        data: {
          analysisJobId: job.id,
          category: cs.category,
          score: cs.score,
          confidence: cs.confidence,
          weight: cs.weight,
          breakdown: cs.breakdown ? (cs.breakdown as any) : undefined,
        },
      });
    }
    await updateStage(job.id, "DETERMINISTIC_SCORING", "SUCCEEDED", 90);

    // 6. Multimodal GPT Synthesis Stage
    await updateStage(job.id, "MULTIMODAL_GPT_SYNTHESIS", "RUNNING", 92);
    const synthesis = await generateStaticSynthesis(
      inspection,
      vision,
      rules,
      scoring,
      {
        brandName: job.brandName,
        targetPlatform: job.targetPlatform,
        creativeGoal: job.creativeGoal,
      },
      imageBuffer
    );

    for (const f of synthesis.findings) {
      await prisma.finding.create({
        data: {
          analysisJobId: job.id,
          type: f.type,
          category: f.category,
          title: f.title,
          description: f.description,
          recommendation: f.recommendation,
          impactPriority: f.impactPriority,
          evidenceIds: f.evidenceIds ? (f.evidenceIds as any) : undefined,
        },
      });
    }
    await updateStage(job.id, "MULTIMODAL_GPT_SYNTHESIS", "SUCCEEDED", 95);

    // 7. Report Publishing Stage
    await updateStage(job.id, "REPORT_PUBLISHING", "RUNNING", 98);
    
    const summaryJson = {
      jobId: job.id,
      title: job.title,
      mode: job.mode,
      status: "SUCCEEDED",
      overallScore: scoring.overallScore,
      inspection,
      visionSummary: {
        extractedText: vision.extractedText,
        textCoveragePercent: vision.textCoveragePercent,
        hasLogo: vision.hasLogo,
        hasFace: vision.hasFace,
        dominantColors: vision.dominantColors,
      },
      categoryScores: scoring.categoryScores,
      rules,
      executiveSummary: synthesis.executiveSummary,
      suggestedActionPlan: synthesis.suggestedActionPlan,
      completedAt: new Date().toISOString(),
    };

    const reportKey = `workspaces/${job.workspaceId}/reports/${job.id}/report.json`;
    await storage.uploadArtifactBuffer(
      Buffer.from(JSON.stringify(summaryJson, null, 2)),
      reportKey,
      "application/json"
    );

    await prisma.reportArtifact.create({
      data: {
        analysisJobId: job.id,
        reportType: "FULL_JSON",
        objectKey: reportKey,
        schemaVersion: "v1",
        summaryJson: summaryJson as any,
      },
    });

    await updateStage(job.id, "REPORT_PUBLISHING", "SUCCEEDED", 100);

    // Mark Job SUCCEEDED
    await prisma.analysisJob.update({
      where: { id: job.id },
      data: {
        status: "SUCCEEDED",
        progressPercent: 100,
        currentStage: "COMPLETED",
        completedAt: new Date(),
        leaseOwner: null,
        leaseExpiresAt: null,
      },
    });

    console.log(`[SIGNAL_CPU_WORKER] Successfully completed Job: ${job.id} with Overall Score: ${scoring.overallScore}/100`);
  } catch (error: any) {
    console.error(`[SIGNAL_CPU_WORKER] Job Failed: ${job.id}`, error);
    await prisma.analysisJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: error.message || "Execution failed",
        leaseOwner: null,
        leaseExpiresAt: null,
      },
    });
  }
}

async function updateStage(jobId: string, stageName: string, status: string, progressPercent: number) {
  await prisma.analysisJob.update({
    where: { id: jobId },
    data: {
      currentStage: stageName,
      progressPercent,
    },
  });

  await prisma.analysisStage.updateMany({
    where: { analysisJobId: jobId, stageName },
    data: {
      status: status as any,
      completedAt: status === "SUCCEEDED" ? new Date() : undefined,
      startedAt: status === "RUNNING" ? new Date() : undefined,
    },
  });
}

async function workerLoop() {
  while (true) {
    try {
      const job = await claimEligibleJob();
      if (job) {
        await processJob(job);
      } else {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    } catch (err) {
      console.error("[SIGNAL_CPU_WORKER] Error in main loop:", err);
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }
}

workerLoop();
