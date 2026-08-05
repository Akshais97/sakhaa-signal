import path from "node:path";
import crypto from "node:crypto";

export const MAX_UPLOAD_SIZE_BYTES =
  Number(process.env.MAX_UPLOAD_SIZE_BYTES) || 500 * 1024 * 1024; // 500 MB default limit

/**
 * Resolves a key relative to a root directory and verifies that the resulting path
 * is strictly contained within the root directory to eliminate path-traversal vulnerabilities.
 * Returns null if the resolved path escapes rootDir.
 */
export function resolvePathSafely(rootDir: string, userKey: string): string | null {
  if (!userKey || typeof userKey !== "string") return null;

  // Sanitize leading directory traversal sequences
  const sanitizedKey = path.normalize(userKey).replace(/^(\.\.[\/\\])+/, "");
  const resolvedRoot = path.resolve(rootDir);
  const resolvedPath = path.resolve(resolvedRoot, sanitizedKey);

  // Enforce strict containment check
  if (!resolvedPath.startsWith(resolvedRoot + path.sep) && resolvedPath !== resolvedRoot) {
    return null;
  }

  return resolvedPath;
}

/**
 * Validates magic bytes of an uploaded file buffer to ensure it is a valid media format (MP4, MOV, WebM, AVI, PNG, JPEG, WebP).
 */
export function validateMediaMagicBytes(buffer: Buffer): { isValid: boolean; detectedType: string } {
  if (!buffer || buffer.length < 4) {
    return { isValid: false, detectedType: "unknown" };
  }

  // Check PNG (89 50 4E 47)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { isValid: true, detectedType: "image/png" };
  }

  // Check JPEG (FF D8 FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedType: "image/jpeg" };
  }

  // Check MP4 / MOV (ftyp at byte offset 4 or leading null box)
  if (
    buffer.length >= 8 &&
    ((buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) ||
      (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x00))
  ) {
    return { isValid: true, detectedType: "video/mp4" };
  }

  // Check WebM / MKV (1A 45 DF A3)
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return { isValid: true, detectedType: "video/webm" };
  }

  // Check RIFF (AVI / WebP)
  if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    const isWebP = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return { isValid: true, detectedType: isWebP ? "image/webp" : "video/avi" };
  }

  return { isValid: false, detectedType: "unrecognized" };
}

/**
 * Computes SHA-256 digest hex string for a given Buffer.
 */
export function calculateSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
