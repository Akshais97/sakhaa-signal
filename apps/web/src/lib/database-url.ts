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
