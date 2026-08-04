export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  IMAGE: ["image/jpeg", "image/png", "image/webp"],
  VIDEO: ["video/mp4", "video/quicktime", "video/webm"],
};

const MAX_FILE_SIZE_BYTES: Record<string, number> = {
  IMAGE: 15 * 1024 * 1024,   // 15 MB
  VIDEO: 300 * 1024 * 1024,  // 300 MB
};

/**
 * Validates uploaded media file size and MIME type against strict quarantine standards.
 */
export function validateUploadMetadata(
  fileName: string,
  contentType: string,
  byteSize: number,
  mediaType: "IMAGE" | "VIDEO"
): ValidationResult {
  if (!fileName || byteSize <= 0) {
    return { valid: false, error: "Empty or invalid file uploaded." };
  }

  const allowedTypes = ALLOWED_MIME_TYPES[mediaType] || [];
  if (!allowedTypes.includes(contentType)) {
    return {
      valid: false,
      error: `Unsupported content type '${contentType}'. Allowed ${mediaType} formats: ${allowedTypes.join(", ")}`,
    };
  }

  const maxSize = MAX_FILE_SIZE_BYTES[mediaType] || 50 * 1024 * 1024;
  if (byteSize > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds the ${maxSizeMB}MB limit for ${mediaType} creatives.`,
    };
  }

  return { valid: true };
}
