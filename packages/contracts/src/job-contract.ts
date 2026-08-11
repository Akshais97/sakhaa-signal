import { z } from "zod";

export const AnalysisModeSchema = z.enum([
  "STATIC_STANDARD",
  "VIDEO_STANDARD",
  "FULL_WITH_TRIBEV2",
]);

export type AnalysisMode = z.infer<typeof AnalysisModeSchema>;

export const JobStatusSchema = z.enum([
  "CREATED",
  "QUEUED",
  "LEASED",
  "RUNNING",
  "RETRY_WAIT",
  "SUCCEEDED",
  "FAILED",
  "CANCEL_REQUESTED",
  "CANCELLED",
  "EXPIRED",
]);

export type JobStatus = z.infer<typeof JobStatusSchema>;

export const PresignUploadRequestSchema = z.object({
  fileName: z.string().min(1).max(240),
  contentType: z.string().min(1).max(120),
  byteSize: z.number().positive().max(524288000), // Max 500 MB
  mediaType: z.enum(["image", "video"]),
});

export type PresignUploadRequest = z.infer<typeof PresignUploadRequestSchema>;

export const CreateAnalysisJobRequestSchema = z.object({
  title: z.string().max(240).optional(),
  mode: z.enum(["STATIC_STANDARD", "VIDEO_STANDARD"]),
  inputArtifactId: z.string().uuid(),
  inputObjectKey: z.string().min(1),
  mediaType: z.enum(["image", "video"]),
  brandName: z.string().max(160).optional(),
  targetPlatform: z.enum(["STATIC_META", "STATIC_GOOGLE", "META", "INSTAGRAM_REELS", "YOUTUBE", "TIKTOK", "LINKEDIN", "GENERIC"]).optional(),
  placement: z.enum(["FEED", "STORY", "REEL", "SHORTS", "PRE_ROLL", "GENERIC"]).optional(),
  creativeGoal: z.string().max(240).optional(),
  selectedModel: z.enum(["gpt-4o", "gpt-5.6-sol", "gpt-4o-mini"]).optional(),
});

export type CreateAnalysisJobRequest = z.infer<typeof CreateAnalysisJobRequestSchema>;

export const AnalysisJobSummarySchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  title: z.string().nullable(),
  mode: AnalysisModeSchema,
  status: JobStatusSchema,
  progressPercent: z.number().int().min(0).max(100),
  currentStage: z.string().nullable(),
  mediaType: z.string(),
  durationSeconds: z.number().nullable(),
  brandName: z.string().nullable(),
  targetPlatform: z.string().nullable(),
  placement: z.string().nullable(),
  creativeGoal: z.string().nullable(),
  selectedModel: z.string().nullable(),
  errorMessage: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AnalysisJobSummary = z.infer<typeof AnalysisJobSummarySchema>;
