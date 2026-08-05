export const INITIAL_ANALYSIS_JOB_STATE = {
  status: "QUEUED",
  currentStage: "QUEUED",
  progressPercent: 0,
} as const;

const SHARED_STANDARD_STAGES = [
  "DOWNLOAD_AND_VALIDATE",
  "PREPROCESSING",
  "COMPUTER_VISION",
  "DETERMINISTIC_SCORING",
  "MULTIMODAL_GPT_SYNTHESIS",
  "REPORT_PUBLISHING",
] as const;

export function getAnalysisStages(mode: string): string[] {
  if (mode === "STATIC_STANDARD") {
    return [
      "DOWNLOAD_AND_VALIDATE",
      "PREPROCESSING",
      "COMPUTER_VISION",
      "RULE_EVALUATION",
      "DETERMINISTIC_SCORING",
      "MULTIMODAL_GPT_SYNTHESIS",
      "REPORT_PUBLISHING",
    ];
  }

  return [...SHARED_STANDARD_STAGES];
}
