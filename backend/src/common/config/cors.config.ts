/**
 * Origins the API always answers to. The localhost pair is DEV-ONLY: with
 * `credentials: true`, a production allowlist containing `http://localhost:*`
 * lets any page a victim happens to run locally (a dev server, an Electron
 * app) read authenticated API responses with the victim's cookies.
 */
const PROD_CORS_ORIGINS = [
  "https://ta-da.co",
  "https://www.ta-da.co",
  "https://stage.ta-da.co",
];

const DEV_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
];

/**
 * Reads CORS_ORIGIN as a comma-separated list and *adds* it to the defaults
 * rather than replacing them.
 *
 * Replacing would be the tidier contract, but the variable already exists on
 * the hosts holding a single stale value (`http://localhost:3000`), left over
 * from before the list was hardcoded. Honouring it as a replacement would drop
 * https://ta-da.co from the allowed origins the moment this ships, and the
 * production frontend would stop being able to call the API at all.
 *
 * Once CORS_ORIGIN is corrected on the hosts, this can become a plain
 * replacement. Note the union means a stale `http://localhost:3000` in the
 * hosts' env re-adds localhost even in production — removing that value from
 * the host `.env` files is the recorded host action that completes this fix.
 */
export function resolveCorsOrigins(raw: string | undefined): string[] {
  const fromEnv = (raw ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaults =
    process.env.NODE_ENV === "production"
      ? PROD_CORS_ORIGINS
      : [...PROD_CORS_ORIGINS, ...DEV_CORS_ORIGINS];

  return [...new Set([...defaults, ...fromEnv])];
}
