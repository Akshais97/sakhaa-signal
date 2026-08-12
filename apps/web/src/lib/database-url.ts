export function getServerlessDatabaseUrl(databaseUrl: string | undefined): string | undefined {
  if (!databaseUrl) return undefined;

  const url = new URL(databaseUrl);
  url.searchParams.set("connection_limit", "1");
  url.searchParams.set("pool_timeout", "20");
  url.searchParams.set("connect_timeout", "10");

  if (url.port === "6543") {
    url.searchParams.set("pgbouncer", "true");
  }

  return url.toString();
}

export type DatabaseConfigurationInput = {
  databaseUrl: string | undefined;
  supabaseUrl: string | undefined;
  requireTransactionPooler: boolean;
};

function getSupabaseProjectRef(supabaseUrl: URL): string | null {
  const [projectRef] = supabaseUrl.hostname.split(".");
  return projectRef || null;
}

function getDatabaseProjectRef(databaseUrl: URL): string | null {
  const decodedUsername = decodeURIComponent(databaseUrl.username);
  const usernameProjectRef = decodedUsername.startsWith("postgres.")
    ? decodedUsername.slice("postgres.".length)
    : null;
  if (usernameProjectRef) return usernameProjectRef;

  const hostParts = databaseUrl.hostname.split(".");
  return hostParts[0] === "db" ? hostParts[1] || null : null;
}

export function validateDatabaseConfiguration(input: DatabaseConfigurationInput): string[] {
  const issues: string[] = [];
  if (!input.databaseUrl) return ["DATABASE_URL_MISSING"];
  if (!input.supabaseUrl) return ["SUPABASE_URL_MISSING"];

  let databaseUrl: URL;
  let supabaseUrl: URL;
  try {
    databaseUrl = new URL(input.databaseUrl);
  } catch {
    return ["DATABASE_URL_INVALID"];
  }
  try {
    supabaseUrl = new URL(input.supabaseUrl);
  } catch {
    return ["SUPABASE_URL_INVALID"];
  }

  if (databaseUrl.protocol !== "postgresql:" && databaseUrl.protocol !== "postgres:") {
    issues.push("DATABASE_PROTOCOL_INVALID");
  }

  if (input.requireTransactionPooler) {
    const isSharedPooler = databaseUrl.hostname.endsWith(".pooler.supabase.com");
    const isDedicatedSupabaseHost =
      databaseUrl.hostname.startsWith("db.") && databaseUrl.hostname.endsWith(".supabase.co");
    if (!isSharedPooler && !isDedicatedSupabaseHost) {
      issues.push("DATABASE_POOLER_HOST_REQUIRED");
    }
    if (databaseUrl.port !== "6543") {
      issues.push("DATABASE_TRANSACTION_PORT_REQUIRED");
    }
  }

  const authProjectRef = getSupabaseProjectRef(supabaseUrl);
  const databaseProjectRef = getDatabaseProjectRef(databaseUrl);
  if (authProjectRef && databaseProjectRef && authProjectRef !== databaseProjectRef) {
    issues.push("SUPABASE_DATABASE_PROJECT_MISMATCH");
  }

  return issues;
}

export function assertDatabaseConfiguration(input: DatabaseConfigurationInput): void {
  const issues = validateDatabaseConfiguration(input);
  if (issues.length > 0) {
    throw new Error(`[DATABASE_CONFIGURATION_ERROR] ${issues.join(",")}`);
  }
}
