import sharp from "sharp";

export interface ImageInspectionResult {
  width: number;
  height: number;
  aspectRatio: number;
  aspectRatioLabel: string; // e.g. "9:16", "1:1", "4:5", "16:9"
  channels: number;
  format: string;
  byteSize: number;
  brightness: number; // 0 to 255
  contrast: number; // stddev of pixel intensities
  blurScore: number; // Higher = sharper, lower = blurry
  isBlurry: boolean;
  safeZoneMarginTopPercent: number; // e.g. 15% upper Meta safe zone
  safeZoneMarginBottomPercent: number; // e.g. 20% lower Meta safe zone
}

export async function inspectImage(imageBuffer: Buffer): Promise<ImageInspectionResult> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1080;
  const height = metadata.height || 1920;
  const aspectRatio = width / height;

  let aspectRatioLabel = "CUSTOM";
  if (Math.abs(aspectRatio - 0.5625) < 0.05) aspectRatioLabel = "9:16 (Vertical Reel/Story)";
  else if (Math.abs(aspectRatio - 1.0) < 0.05) aspectRatioLabel = "1:1 (Square Feed)";
  else if (Math.abs(aspectRatio - 0.8) < 0.05) aspectRatioLabel = "4:5 (Portrait Feed)";
  else if (Math.abs(aspectRatio - 1.777) < 0.05) aspectRatioLabel = "16:9 (Landscape)";

  // Extract raw grayscale pixels for brightness, contrast & blur math
  const { data: rawBuffer, info } = await sharp(imageBuffer)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = info.width * info.height;
  let sum = 0;
  for (let i = 0; i < rawBuffer.length; i++) {
    sum += rawBuffer[i];
  }
  const brightness = sum / pixelCount;

  let varianceSum = 0;
  for (let i = 0; i < rawBuffer.length; i++) {
    const diff = rawBuffer[i] - brightness;
    varianceSum += diff * diff;
  }
  const contrast = Math.sqrt(varianceSum / pixelCount);

  // Approximate Laplacian variance for blur score
  let laplacianSum = 0;
  const w = info.width;
  for (let y = 1; y < info.height - 1; y += 2) {
    for (let x = 1; x < info.width - 1; x += 2) {
      const idx = y * w + x;
      const val =
        rawBuffer[idx - w] +
        rawBuffer[idx + w] +
        rawBuffer[idx - 1] +
        rawBuffer[idx + 1] -
        4 * rawBuffer[idx];
      laplacianSum += Math.abs(val);
    }
  }
  const blurScore = laplacianSum / (pixelCount / 4);
  const isBlurry = blurScore < 12.0;

  return {
    width,
    height,
    aspectRatio,
    aspectRatioLabel,
    channels: metadata.channels || 3,
    format: metadata.format || "jpeg",
    byteSize: imageBuffer.byteLength,
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    blurScore: Math.round(blurScore * 10) / 10,
    isBlurry,
    safeZoneMarginTopPercent: 15,
    safeZoneMarginBottomPercent: 20,
  };
}
