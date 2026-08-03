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
  analyzeStaticCreativeWithOpenAI,
  evaluateStaticRules,
  computeStaticCategoryScores,
  inspectVideo,
  analyzeVideoWithIntelligence,
  transcribeAudioWithGroq,
  classifyAudioWithYAMNet,
  scoreVideoCreative,
  generateVideoSynthesis,
} from "@sakhaa-signal/engines";
import { readFile } from "node:fs/promises";

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

export async function processJob(job: any) {
  console.log(`[SIGNAL_CPU_WORKER] Processing Job: ${job.id} (${job.mode} - ${job.mediaType}) [Model: ${job.selectedModel || "default"}]`);
  const tempDir = path.resolve(os.tmpdir(), "sakhaa-signal", job.id);

  try {
    // 1. Download & Validate Stage
    await updateStage(job.id, "DOWNLOAD_AND_VALIDATE", "RUNNING", 10);
    const localInputPath = path.join(tempDir, "input_media");
    await storage.downloadToLocal(job.inputObjectKey, localInputPath);
    await updateStage(job.id, "DOWNLOAD_AND_VALIDATE", "SUCCEEDED", 20);

    const mediaBuffer = await readFile(localInputPath);
    if (!mediaBuffer || mediaBuffer.byteLength === 0) {
      throw new Error(`Downloaded media file (${job.inputObjectKey}) is empty (0 bytes). Please re-upload a valid file.`);
    }

    const isVideo = job.mediaType === "VIDEO" || job.mode === "VIDEO_STANDARD" || job.inputObjectKey.match(/\.(mp4|mov|webm)$/i);

    if (isVideo) {
      await processVideoJob(job, mediaBuffer);
    } else {
      await processStaticJob(job, mediaBuffer);
    }
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

async function processStaticJob(job: any, imageBuffer: Buffer) {
  // Preprocessing Stage (Inspection)
  await updateStage(job.id, "PREPROCESSING", "RUNNING", 30);
  const inspection = await inspectImage(imageBuffer);
  await updateStage(job.id, "PREPROCESSING", "SUCCEEDED", 40);

  // Computer Vision Stage
  await updateStage(job.id, "COMPUTER_VISION", "RUNNING", 50);
  const vision = await analyzeStaticCreativeWithOpenAI(
    imageBuffer,
    inspection,
    {
      brandName: job.brandName,
      targetPlatform: job.targetPlatform,
      placement: job.placement,
      creativeGoal: job.creativeGoal,
    },
    job.selectedModel
  );

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

  // Rule Evaluation Stage
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

  // Deterministic Scoring Stage
  await updateStage(job.id, "DETERMINISTIC_SCORING", "RUNNING", 85);
  const scoring = computeStaticCategoryScores(inspection, vision, rules, {
    targetPlatform: job.targetPlatform,
    brandName: job.brandName,
    creativeGoal: job.creativeGoal,
  });

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

  // Strategic Synthesis Stage
  await updateStage(job.id, "MULTIMODAL_GPT_SYNTHESIS", "RUNNING", 92);
  for (const f of vision.findings) {
    await prisma.finding.create({
      data: {
        analysisJobId: job.id,
        type: f.type,
        category: f.category,
        title: f.title,
        description: f.description,
        recommendation: f.recommendation,
        impactPriority: f.impactPriority,
        evidenceIds: (f.evidenceRefs && f.evidenceRefs.length > 0) ? (f.evidenceRefs as any) : (f.evidenceIds as any),
      },
    });
  }
  await updateStage(job.id, "MULTIMODAL_GPT_SYNTHESIS", "SUCCEEDED", 95);

  // Report Publishing
  await updateStage(job.id, "REPORT_PUBLISHING", "RUNNING", 98);
  const summaryJson = {
    jobId: job.id,
    title: job.title,
    mode: job.mode,
    status: "SUCCEEDED",
    selectedModel: vision.modelUsed,
    overallScore: scoring.overallScore,
    confidenceInterval: scoring.confidenceInterval || vision.confidenceInterval,
    appliedRules: scoring.appliedRules || [],
    inspection,
    visionSummary: {
      extractedText: vision.extractedText,
      textCoveragePercent: vision.textCoveragePercent,
      hasLogo: vision.hasLogo,
      logoLabel: vision.logoLabel,
      hasFace: vision.hasFace,
      dominantColors: vision.dominantColors,
    },
    categoryScores: scoring.categoryScores,
    rawMetrics: vision.rawMetrics,
    rules,
    executiveSummary: vision.executiveSummary,
    findings: vision.findings,
    quickWins: vision.quickWins || [],
    abVariantHypotheses: vision.abVariantHypotheses || [],
    suggestedActionPlan: vision.suggestedActionPlan,
    completedAt: new Date().toISOString(),
  };

  await saveReportAndComplete(job, summaryJson);
}

async function processVideoJob(job: any, videoBuffer: Buffer) {
  // 1. Preprocessing Stage (Inspection & Keyframe Extraction)
  await updateStage(job.id, "PREPROCESSING", "RUNNING", 30);
  const inspection = await inspectVideo(videoBuffer, path.basename(job.inputObjectKey));
  await updateStage(job.id, "PREPROCESSING", "SUCCEEDED", 40);

  // 2. Video Intelligence & Speech/Audio Stage
  await updateStage(job.id, "COMPUTER_VISION", "RUNNING", 50);
  const intelligence = await analyzeVideoWithIntelligence(videoBuffer, inspection.durationMs);
  const transcript = await transcribeAudioWithGroq(inspection.audioWavBuffer, inspection.durationMs);
  const audio = await classifyAudioWithYAMNet(inspection.audioWavBuffer, inspection.durationMs);
  await updateStage(job.id, "COMPUTER_VISION", "SUCCEEDED", 65);

  // 3. Rule & Scoring Stage
  await updateStage(job.id, "DETERMINISTIC_SCORING", "RUNNING", 80);
  const scoring = scoreVideoCreative(inspection, intelligence, transcript, audio);
  
  for (const [key, cs] of Object.entries(scoring.categoryScores)) {
    await prisma.categoryScore.create({
      data: {
        analysisJobId: job.id,
        category: key.toUpperCase(),
        score: cs.score,
        confidence: 0.9,
        weight: cs.weight,
        breakdown: { keyFactor: cs.keyFactor, label: cs.label, status: cs.status } as any,
      },
    });
  }
  await updateStage(job.id, "DETERMINISTIC_SCORING", "SUCCEEDED", 88);

  // 4. Video Synthesis Stage (GPT-5.6 Sol Timeline Analysis)
  await updateStage(job.id, "MULTIMODAL_GPT_SYNTHESIS", "RUNNING", 92);
  const synthesis = await generateVideoSynthesis(
    inspection,
    intelligence,
    transcript,
    audio,
    scoring,
    { brandName: job.brandName, targetPlatform: job.targetPlatform, creativeGoal: job.creativeGoal }
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

  // 5. Report Publishing Stage
  await updateStage(job.id, "REPORT_PUBLISHING", "RUNNING", 98);
  const summaryJson = {
    jobId: job.id,
    title: job.title,
    mode: job.mode || "VIDEO_STANDARD",
    status: "SUCCEEDED",
    mediaType: "VIDEO",
    overallScore: scoring.overallScore,
    tier: scoring.tier,
    inspection: {
      durationMs: inspection.durationMs,
      width: inspection.width,
      height: inspection.height,
      fps: inspection.fps,
      aspectRatio: inspection.aspectRatio,
      aspectRatioLabel: inspection.aspectRatioLabel,
      hasAudio: inspection.hasAudio,
      keyframeTimestamps: inspection.keyframes.map((k) => k.timestampMs),
    },
    intelligence: {
      textAnnotations: intelligence.textAnnotations,
      shotCuts: intelligence.shotCuts,
      logos: intelligence.logos,
    },
    transcript: {
      fullTranscript: transcript.fullTranscript,
      words: transcript.words,
      language: transcript.language,
    },
    audio: {
      timeline: audio.timeline,
      speechRatio: audio.speechRatio,
      musicRatio: audio.musicRatio,
      silenceRatio: audio.silenceRatio,
    },
    categoryScores: scoring.categoryScores,
    executiveSummary: synthesis.executiveSummary,
    hookDropoffRisk: synthesis.hookDropoffRisk,
    first3SecImpactSummary: synthesis.first3SecImpactSummary,
    findings: synthesis.findings,
    suggestedActionPlan: synthesis.suggestedActionPlan,
    recommendedAEditVariants: synthesis.recommendedAEditVariants || [],
    completedAt: new Date().toISOString(),
  };

  await saveReportAndComplete(job, summaryJson);
}

async function saveReportAndComplete(job: any, summaryJson: any) {
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

  console.log(`[SIGNAL_CPU_WORKER] Successfully completed Job: ${job.id} (${job.mode}) with Score: ${summaryJson.overallScore}/100`);
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
