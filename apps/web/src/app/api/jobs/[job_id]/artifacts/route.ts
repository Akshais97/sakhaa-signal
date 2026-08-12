import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { user, workspace }: any = await getAuthenticatedSession();
    const ws: any = workspace;
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { job_id } = await params;

    const job = await prisma.job.findUnique({
      where: { id: job_id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.workspaceId !== ws.id && !user.isPlatformAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const host = req.nextUrl.origin;
    
    // Relative paths matching the required output artifact contract (§9)
    const files = [
      "encoded_features/video_embeddings.pt",
      "encoded_features/audio_embeddings.pt",
      "encoded_features/text_embeddings.pt",
      "transformer_inputs/fused_sequence_tensor.pt",
      "raw_transformer_outputs/raw_predictions.npy",
      "hcp_mapping/brain_area_activations.csv",
      "marketing_scores/marketing_scores.json",
      "marketing_scores/marketing_outcome_scores.csv",
      "llm_explanation/explanation_report.json",
      "llm_explanation/explanation_report.md",
      "llm_explanation/executive_summary.txt",
      "training_export/training_ready_bundle.zip",
      "exports/full_result_bundle.zip",
      "manifest.json"
    ];

    const artifacts = files.reduce((acc: any, filePath: string) => {
      const key = `exports/${job_id}/${filePath}`;
      acc[filePath.split("/").pop() || filePath] = {
        key,
        url: `${host}/api/storage/download?key=${key}`,
      };
      return acc;
    }, {} as Record<string, { key: string, url: string }>);

    return NextResponse.json({
      job_id,
      status: job.status === "SUCCEEDED" ? "COMPLETED" : job.status,
      artifacts
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to list job artifacts", details: error.message },
      { status: 500 }
    );
  }
}
