import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

type StorageClient = {
  send(command: GetObjectCommand | PutObjectCommand): Promise<any>;
};

type StorageAdapterOptions = {
  provider?: string;
  s3Client?: StorageClient;
};

function getHttpStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const metadata = "$metadata" in error ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata : undefined;
  return metadata?.httpStatusCode;
}

function isMissingObjectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String((error as { name?: unknown }).name) : "";
  return getHttpStatusCode(error) === 404 || name === "NoSuchKey" || name === "NotFound";
}

function describeStorageError(error: unknown): string {
  const statusCode = getHttpStatusCode(error);
  const message = error instanceof Error ? error.message : String(error);
  return statusCode ? `HTTP ${statusCode}: ${message}` : message;
}

export class StorageAdapter {
  private s3Client?: StorageClient;
  private provider: string;

  constructor(options: StorageAdapterOptions = {}) {
    this.provider = options.provider || process.env.OBJECT_STORAGE_PROVIDER || "local-filesystem";
    if (options.s3Client) {
      this.s3Client = options.s3Client;
      return;
    }

    if ((this.provider === "b2" || this.provider === "s3") && process.env.AWS_ACCESS_KEY_ID) {
      this.s3Client = new S3Client({
        region: process.env.AWS_DEFAULT_REGION || process.env.OBJECT_STORAGE_REGION || "eu-central-003",
        endpoint: process.env.AWS_ENDPOINT_URL || process.env.OBJECT_STORAGE_ENDPOINT,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.OBJECT_STORAGE_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.OBJECT_STORAGE_APPLICATION_KEY || "",
        },
        forcePathStyle: true,
      });
    }
  }

  async downloadToLocal(objectKey: string, destLocalPath: string): Promise<void> {
    await mkdir(path.dirname(destLocalPath), { recursive: true });

    if (this.s3Client) {
      try {
        const bucket = process.env.B2_BUCKET_QUARANTINE || process.env.B2_BUCKET_CLEAN_MEDIA || "v0-local-quarantine";
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        });

        const response = await this.s3Client.send(command);
        if (response.Body) {
          await pipeline(response.Body as Readable, createWriteStream(destLocalPath));
          return;
        }
      } catch (error: unknown) {
        if (!isMissingObjectError(error)) {
          throw new Error(
            `S3/B2 download failed for media object "${objectKey}" (${describeStorageError(error)}).`,
            { cause: error },
          );
        }
        console.warn(`[STORAGE_WARNING] Media object "${objectKey}" was not found in S3/B2. Checking local storage simulator fallback...`);
      }
    }

    // Read from local simulator path
    const localSimRoots = [
      path.resolve(process.cwd(), ".local", "storage", "v0-local-quarantine"),
      path.resolve(process.cwd(), "..", "..", ".local", "storage", "v0-local-quarantine"),
      path.resolve(process.cwd(), "..", "..", "apps", "web", ".local", "storage", "v0-local-quarantine"),
      path.resolve(process.cwd(), "apps", "web", ".local", "storage", "v0-local-quarantine"),
    ];

    let foundPath: string | null = null;
    for (const root of localSimRoots) {
      const candidate = path.join(root, objectKey);
      if (existsSync(candidate)) {
        foundPath = candidate;
        break;
      }
    }

    if (!foundPath) {
      throw new Error(`Media object key "${objectKey}" not found in S3/B2 or local storage.`);
    }

    await copyFile(foundPath, destLocalPath);
  }

  async uploadArtifactBuffer(buffer: Buffer, objectKey: string, contentType: string): Promise<string> {
    if (this.s3Client) {
      try {
        const bucket = process.env.B2_BUCKET_PRIVATE_ARTIFACTS || "v0-local-artifacts";
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          ContentType: contentType,
          Body: buffer,
        });

        await this.s3Client.send(command);
        return objectKey;
      } catch (err: any) {
        console.warn(`[STORAGE_WARNING] S3/B2 upload failed (${err.message}). Saving to local storage simulator...`);
      }
    }

    const localSimRoot = path.resolve(process.cwd(), ".local", "storage", "v0-local-artifacts");
    const destPath = path.join(localSimRoot, objectKey);
    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, buffer);
    return objectKey;
  }
}
