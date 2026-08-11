export const STANDARD_ANALYSIS_MODES = [
  "STATIC_STANDARD",
  "VIDEO_STANDARD",
] as const;

export type StandardAnalysisMode = (typeof STANDARD_ANALYSIS_MODES)[number];

export const ALLOWED_ANALYSIS_MODELS = [
  "gpt-4o",
  "gpt-5.6-sol",
  "gpt-4o-mini",
] as const;

export type AllowedAnalysisModel = (typeof ALLOWED_ANALYSIS_MODELS)[number];

export const ANALYSIS_STAGE = {
  DOWNLOAD_AND_VALIDATE: "DOWNLOAD_AND_VALIDATE",
  PREPROCESSING: "PREPROCESSING",
  COMPUTER_VISION: "COMPUTER_VISION",
  RULE_EVALUATION: "RULE_EVALUATION",
  DETERMINISTIC_SCORING: "DETERMINISTIC_SCORING",
  MULTIMODAL_GPT_SYNTHESIS: "MULTIMODAL_GPT_SYNTHESIS",
  REPORT_PUBLISHING: "REPORT_PUBLISHING",
} as const;

export const INITIAL_ANALYSIS_JOB_STATE = {
  status: "QUEUED" as const,
  progressPercent: 0,
  currentStage: ANALYSIS_STAGE.DOWNLOAD_AND_VALIDATE,
};

export const STATIC_ANALYSIS_STAGES = [
  ANALYSIS_STAGE.DOWNLOAD_AND_VALIDATE,
  ANALYSIS_STAGE.PREPROCESSING,
  ANALYSIS_STAGE.COMPUTER_VISION,
  ANALYSIS_STAGE.RULE_EVALUATION,
  ANALYSIS_STAGE.DETERMINISTIC_SCORING,
  ANALYSIS_STAGE.MULTIMODAL_GPT_SYNTHESIS,
  ANALYSIS_STAGE.REPORT_PUBLISHING,
] as const;

export const VIDEO_ANALYSIS_STAGES = [
  ANALYSIS_STAGE.DOWNLOAD_AND_VALIDATE,
  ANALYSIS_STAGE.PREPROCESSING,
  ANALYSIS_STAGE.COMPUTER_VISION,
  ANALYSIS_STAGE.DETERMINISTIC_SCORING,
  ANALYSIS_STAGE.MULTIMODAL_GPT_SYNTHESIS,
  ANALYSIS_STAGE.REPORT_PUBLISHING,
] as const;

export type AnalysisStageName =
  | (typeof STATIC_ANALYSIS_STAGES)[number]
  | (typeof VIDEO_ANALYSIS_STAGES)[number];

export function getAnalysisStages(mode: StandardAnalysisMode): AnalysisStageName[] {
  return mode === "STATIC_STANDARD"
    ? [...STATIC_ANALYSIS_STAGES]
    : [...VIDEO_ANALYSIS_STAGES];
}

export function isStandardAnalysisMode(value: unknown): value is StandardAnalysisMode {
  return STANDARD_ANALYSIS_MODES.includes(value as StandardAnalysisMode);
}

export function isAllowedAnalysisModel(value: unknown): value is AllowedAnalysisModel {
  return ALLOWED_ANALYSIS_MODELS.includes(value as AllowedAnalysisModel);
}
