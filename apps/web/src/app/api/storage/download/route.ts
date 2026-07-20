import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing storage key query param" }, { status: 400 });
    }

    const storageProvider = process.env.OBJECT_STORAGE_PROVIDER || "local-filesystem";

    if (storageProvider === "s3" || storageProvider === "b2") {
      const endpoint = process.env.AWS_ENDPOINT_URL || process.env.OBJECT_STORAGE_ENDPOINT;
      const region = process.env.AWS_DEFAULT_REGION || process.env.OBJECT_STORAGE_REGION || "eu-central-003";
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.OBJECT_STORAGE_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.OBJECT_STORAGE_APPLICATION_KEY;
      const bucket = process.env.B2_BUCKET_PRIVATE_ARTIFACTS || "v0-local-artifacts";

      if (!accessKeyId || !secretAccessKey || !endpoint) {
        throw new Error(
          `S3/B2 storage provider selected (${storageProvider}) but missing environment configuration credentials.`
        );
      }

      console.log(`[STORAGE API] Generating presigned GET download URL for key: ${key} in bucket: ${bucket}...`);

      const s3Client = new S3Client({
        endpoint: endpoint,
        region: region,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        },
        forcePathStyle: true, // Required for Backblaze B2 and similar S3-compatible APIs
      });

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      // Generate a presigned GET URL valid for 15 minutes
      const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

      console.log(`[STORAGE API SUCCESS] Redirecting browser to presigned GET URL.`);
      return NextResponse.redirect(downloadUrl);
    } else {
      // Local development fallback: direct file read from local simulator storage
      console.log(`[STORAGE API] Using local-filesystem download fallback for key: ${key}`);
      const storageRoot = path.resolve(process.cwd(), ".local", "storage", "v0-local-artifacts");
      const filePath = path.join(storageRoot, key);

      try {
        const fileBuffer = await readFile(filePath);
        
        const headers = new Headers();
        headers.set("Content-Type", "application/octet-stream");
        headers.set("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
        headers.set("Content-Length", fileBuffer.byteLength.toString());

        return new Response(fileBuffer, {
          status: 200,
          headers
        });
      } catch (err) {
        return NextResponse.json({ error: "Artifact file not found in storage simulator" }, { status: 404 });
      }
    }
  } catch (error: any) {
    console.error("[STORAGE API ERROR] Failed to download artifact:", error);
    return NextResponse.json(
      { error: "Failed to download artifact", details: error.message },
      { status: 500 }
    );
  }
}
