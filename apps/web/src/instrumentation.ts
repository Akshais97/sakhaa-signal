import { assertDatabaseConfiguration } from "./lib/database-url";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;

  const required = [
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_ENDPOINT_URL",
    "AWS_DEFAULT_REGION",
    "B2_BUCKET_QUARANTINE",
    "B2_BUCKET_PRIVATE_ARTIFACTS",
    "BILLING_WEBHOOK_SECRET",
    "OPENAI_API_KEY",
    "GROQ_API_KEY",
  ];
  const missing = required.filter((name: string) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required web environment variables: ${missing.join(", ")}`);
  }

  assertDatabaseConfiguration({
    databaseUrl: process.env.DATABASE_URL,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    requireTransactionPooler: process.env.VERCEL === "1",
  });
}
