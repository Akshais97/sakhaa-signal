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
  TemporalEvidenceGraph,
  computePPCScoring,
  runBrainOrchestration,
  detectSpeechIntervalsWithSileroVAD,
} from "@sakhaa-signal/engines";
import { readFile } from "node:fs/promises";

function getWorkerDbUrl() {
  const url = process.env.DATABASE_URL || "";
  if (!url) return undefined;
  if (url.includes("connection_limit=")) {
    return url.replace(/connection_limit=\d+/, "connection_limit=5");
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=5&pool_timeout=20`;
}

const workerDbUrl = getWorkerDbUrl();
const prisma = new PrismaClient({
  ...(workerDbUrl ? { datasources: { db: { url: workerDbUrl } } } : {}),
});
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
        // Recover analysis jobs created during the 2026-08 queue regression.
        { status: "CREATED" },
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

    const isVideo = job.mediaType === "VIDEO" || job.mode === "VIDEO_STANDARD" || job.mode === "FULL_WITH_TRIBEV2" || job.inputObjectKey.match(/\.(mp4|mov|webm)$/i);

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

  // 2. Video Intelligence & Speech/Audio Evidence Stage
  await updateStage(job.id, "COMPUTER_VISION", "RUNNING", 50);
  const intelligence = await analyzeVideoWithIntelligence(videoBuffer, inspection.durationMs);
  const transcript = await transcribeAudioWithGroq(inspection.audioWavBuffer, inspection.durationMs);
  const audio = await classifyAudioWithYAMNet(inspection.audioWavBuffer, inspection.durationMs);
  const vad = await detectSpeechIntervalsWithSileroVAD(inspection.audioWavBuffer, inspection.durationMs);

  // Construct Temporal Evidence Graph
  const evidenceGraph = new TemporalEvidenceGraph(inspection.durationMs);

  // Populated evidence graph with speech, text, shot cut, and logo tracks
  for (const w of transcript.words) {
    evidenceGraph.addObservation({
      id: `word_${w.startMs}`,
      timestampMs: w.startMs,
      endMs: w.endMs,
      role: "TRANSCRIPT_WORD",
      value: w.word,
      confidence: 0.9,
      provider: transcript.provider,
    });
  }

  for (const t of intelligence.textAnnotations) {
    evidenceGraph.addObservation({
      id: `ocr_${t.startMs}`,
      timestampMs: t.startMs,
      endMs: t.endMs,
      role: "TEXT_OVERLAY",
      value: t.text,
      confidence: t.confidence,
      boundingBox: t.boundingBox,
      provider: intelligence.provider,
    });
  }

  for (const s of intelligence.shotCuts) {
    evidenceGraph.addObservation({
      id: `shot_${s.startMs}`,
      timestampMs: s.startMs,
      endMs: s.endMs,
      role: "SHOT_CUT",
      value: "SCENE_CUT",
      confidence: 0.95,
      provider: "SHOT_DETECTOR",
    });
  }

  for (const l of intelligence.logos) {
    evidenceGraph.addObservation({
      id: `logo_${l.startMs}`,
      timestampMs: l.startMs,
      endMs: l.endMs,
      role: "BRAND_LOGO",
      value: l.entityDescription,
      confidence: l.confidence,
      provider: "BRAND_MATCHER",
    });
  }

  await updateStage(job.id, "COMPUTER_VISION", "SUCCEEDED", 65);

  // 3. Rule & 8-Category PPC Scoring Stage
  await updateStage(job.id, "DETERMINISTIC_SCORING", "RUNNING", 80);
  const ppcScoring = computePPCScoring(evidenceGraph);
  const legacyScoring = scoreVideoCreative(inspection, intelligence, transcript, audio);
  
  const categoryEnumMap: Record<string, string> = {
    hookRetention: "HOOK_RETENTION",
    messageComprehension: "MESSAGE_COMPREHENSION",
    narrativeClarity: "NARRATIVE_CLARITY",
    brandProductIntegration: "BRAND_PRODUCT_INTEGRATION",
    offerTrustConversion: "OFFER_TRUST_CONVERSION",
    audioVisualCraft: "AUDIO_VISUAL_CRAFT",
    platformNativeFit: "PLATFORM_NATIVE_FIT",
    complianceClaimSafety: "COMPLIANCE_CLAIM_SAFETY",
  };

  for (const [key, cs] of Object.entries(ppcScoring.categories)) {
    const enumCategory = categoryEnumMap[key] || key.toUpperCase();
    await prisma.categoryScore.create({
      data: {
        analysisJobId: job.id,
        category: enumCategory,
        score: cs.score,
        confidence: cs.confidence,
        weight: cs.weight,
        breakdown: { keyFactor: cs.keyFactor, label: cs.label, status: cs.status } as any,
      },
    });
  }
  await updateStage(job.id, "DETERMINISTIC_SCORING", "SUCCEEDED", 88);

  // 4. Video Synthesis Stage (GPT-5.6 Sol / Terra Brain Orchestration)
  await updateStage(job.id, "MULTIMODAL_GPT_SYNTHESIS", "RUNNING", 92);
  
  let brainDiagnosis: any = null;
  let fallbackSynthesis: any = null;

  try {
    brainDiagnosis = await runBrainOrchestration(evidenceGraph, {
      brandName: job.brandName,
      targetPlatform: job.targetPlatform,
      creativeGoal: job.creativeGoal,
    });
  } catch (brainErr: any) {
    console.warn("[SIGNAL_CPU_WORKER] Brain Orchestration non-fatal exception handled:", brainErr?.message || brainErr);
  }

  try {
    fallbackSynthesis = await generateVideoSynthesis(
      inspection,
      intelligence,
      transcript,
      audio,
      legacyScoring,
      { brandName: job.brandName, targetPlatform: job.targetPlatform, creativeGoal: job.creativeGoal }
    );
  } catch (synErr: any) {
    console.warn("[SIGNAL_CPU_WORKER] Fallback synthesis non-fatal exception handled:", synErr?.message || synErr);
  }

  const activeFindings = (brainDiagnosis?.findings && brainDiagnosis.findings.length > 0)
    ? brainDiagnosis.findings
    : (fallbackSynthesis?.findings || []);

  for (const f of activeFindings) {
    await prisma.finding.create({
      data: {
        analysisJobId: job.id,
        type: (f.type as any) || "WEAKNESS",
        category: (f.category as any) || "HOOK_RETENTION",
        title: f.title || (f as any).observation || "Finding",
        description: (f as any).description || (f as any).observation || "",
        recommendation: (f as any).recommendation?.change || (f as any).recommendation || undefined,
        impactPriority: (f as any).impactPriority || (f as any).severity || "MEDIUM",
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
    overallScore: ppcScoring.overallCreativeScore,
    tier: ppcScoring.tier,
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
    evidenceGraph: evidenceGraph.exportGraphJSON(),
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
      speechIntervals: vad.speechIntervals,
    },
    categoryScores: ppcScoring.categories,
    executiveSummary: brainDiagnosis?.executiveSummary || fallbackSynthesis?.executiveSummary || "Video analysis complete.",
    hookDropoffRisk: fallbackSynthesis?.hookDropoffRisk || "MEDIUM",
    first3SecImpactSummary: brainDiagnosis?.first3SecImpactSummary || fallbackSynthesis?.first3SecImpactSummary || "Opening 0-3s evaluated.",
    findings: activeFindings,
    suggestedActionPlan: (brainDiagnosis?.suggestedActionPlan && brainDiagnosis.suggestedActionPlan.length > 0)
      ? brainDiagnosis.suggestedActionPlan
      : (fallbackSynthesis?.suggestedActionPlan || []),
    recommendedAEditVariants: (brainDiagnosis?.recommendedAEditVariants && brainDiagnosis.recommendedAEditVariants.length > 0)
      ? brainDiagnosis.recommendedAEditVariants
      : (fallbackSynthesis?.recommendedAEditVariants || []),
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
