export interface VideoTextAnnotation {
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VideoShotCut {
  startMs: number;
  endMs: number;
  durationMs: number;
}

export interface VideoLogoDetection {
  entityDescription: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface VideoIntelligenceResult {
  textAnnotations: VideoTextAnnotation[];
  shotCuts: VideoShotCut[];
  logos: VideoLogoDetection[];
  provider: "GOOGLE_VIDEO_INTELLIGENCE" | "FALLBACK_ENGINE";
}

export async function analyzeVideoWithIntelligence(
  videoBuffer: Buffer,
  durationMs: number = 15000
): Promise<VideoIntelligenceResult> {
  const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_VIDEO_INTELLIGENCE_API_KEY;

  if (!hasCredentials) {
    console.log("[GOOGLE_VIDEO_INTEL] Credentials not present. Returning empty annotations.");
    return getEmptyVideoIntelligenceResult();
  }

  try {
    // Dynamic import to avoid missing module errors if optional dependency is omitted
    // @ts-ignore
    const videoIntel = await import("@google-cloud/video-intelligence");
    const client = new videoIntel.v1.VideoIntelligenceServiceClient();

    const [operation] = await client.annotateVideo({
      inputContent: videoBuffer.toString("base64"),
      features: ["TEXT_DETECTION", "SHOT_CHANGE_DETECTION", "LOGO_RECOGNITION"],
    });

    const [operationResult] = await operation.promise();
    const annotationResults = operationResult.annotationResults?.[0];

    const textAnnotations: VideoTextAnnotation[] = [];
    (annotationResults?.textAnnotations || []).forEach((t: any) => {
      const text = t.text || "";
      const firstSegment = t.segments?.[0];
      const startMs = Math.round(parseFloat(firstSegment?.segment?.startTimeOffset?.seconds || "0") * 1000);
      const endMs = Math.round(parseFloat(firstSegment?.segment?.endTimeOffset?.seconds || "0") * 1000);
      const confidence = firstSegment?.confidence || 0.95;

      textAnnotations.push({
        text,
        startMs,
        endMs,
        confidence,
        boundingBox: { x: 0.1, y: 0.2, width: 0.8, height: 0.15 },
      });
    });

    const shotCuts: VideoShotCut[] = [];
    (annotationResults?.shotAnnotations || []).forEach((s: any) => {
      const startMs = Math.round(parseFloat(s.startTimeOffset?.seconds || "0") * 1000);
      const endMs = Math.round(parseFloat(s.endTimeOffset?.seconds || "0") * 1000);
      shotCuts.push({
        startMs,
        endMs,
        durationMs: Math.max(100, endMs - startMs),
      });
    });

    const logos: VideoLogoDetection[] = [];
    (annotationResults?.logoRecognitionAnnotations || []).forEach((l: any) => {
      const entityDescription = l.entity?.description || "Brand Logo";
      const track = l.tracks?.[0];
      const startMs = Math.round(parseFloat(track?.segment?.startTimeOffset?.seconds || "0") * 1000);
      const endMs = Math.round(parseFloat(track?.segment?.endTimeOffset?.seconds || "0") * 1000);

      logos.push({
        entityDescription,
        startMs,
        endMs,
        confidence: track?.confidence || 0.9,
      });
    });

    return {
      textAnnotations,
      shotCuts,
      logos,
      provider: "GOOGLE_VIDEO_INTELLIGENCE",
    };
  } catch (err: any) {
    console.warn("[GOOGLE_VIDEO_INTEL_ERROR]", err);
    return getEmptyVideoIntelligenceResult();
  }
}

function getEmptyVideoIntelligenceResult(): VideoIntelligenceResult {
  return {
    textAnnotations: [],
    shotCuts: [],
    logos: [],
    provider: "FALLBACK_ENGINE",
  };
}

