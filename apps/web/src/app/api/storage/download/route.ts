import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing storage key query param" }, { status: 400 });
    }

    // Determine the local filesystem destination (stored inside the clean artifacts bucket folder)
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
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to download artifact", details: error.message },
      { status: 500 }
    );
  }
}
