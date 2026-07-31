/**
 * Origins the API answers to when CORS_ORIGIN says nothing. This is the list
 * that used to be hardcoded in main.ts.
 */
const DEFAULT_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://ta-da.co",
  "https://www.ta-da.co",
  "https://stage.ta-da.co",
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
 * Once step 3.1 has established what the hosts really carry and CORS_ORIGIN is
 * corrected there, this can become a plain replacement.
 */
export function resolveCorsOrigins(raw: string | undefined): string[] {
  const fromEnv = (raw ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_CORS_ORIGINS, ...fromEnv])];
}
