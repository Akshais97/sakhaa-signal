import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export class StorageAdapter {
  private s3Client?: S3Client;
  private provider: string;

  constructor() {
    this.provider = process.env.OBJECT_STORAGE_PROVIDER || "local-filesystem";
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
          const stream = response.Body as Readable;
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
          }
          await writeFile(destLocalPath, Buffer.concat(chunks));
          return;
        }
      } catch (err: any) {
        console.warn(`[STORAGE_WARNING] S3/B2 download failed (${err.message}). Checking local storage simulator fallback...`);
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

    const data = await readFile(foundPath);
    await writeFile(destLocalPath, data);
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
