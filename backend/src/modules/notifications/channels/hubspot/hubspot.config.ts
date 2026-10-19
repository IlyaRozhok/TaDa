import { ConfigService } from "@nestjs/config";

/** HubSpot's REST base. EU portals (pat-eu1-…) use the same host. */
export const HUBSPOT_API_BASE = "https://api.hubapi.com";

/** A HubSpot call that takes longer than this is abandoned and retried later. */
export const HUBSPOT_TIMEOUT_MS = 10_000;

export interface HubspotConfig {
  /** True only with HUBSPOT_ENABLED=true AND a token. */
  enabled: boolean;
  /** HUBSPOT_ENABLED=true was asked for (enabled may still be false: no token). */
  requested: boolean;
  /** Server-only Service Key. Never logged, never sent to the client. */
  token: string | null;
  /** For building record links in logs; optional. */
  portalId: string | null;
}

/**
 * Read per call, like the notification flags, so flipping the switch needs a
 * container restart but no rebuild. OFF unless HUBSPOT_ENABLED is exactly
 * "true" — the safe default for a third-party sync.
 */
export function readHubspotConfig(config: ConfigService): HubspotConfig {
  const requested =
    (config.get<string>("HUBSPOT_ENABLED") ?? "").trim().toLowerCase() === "true";
  const token = config.get<string>("HUBSPOT_ACCESS_TOKEN")?.trim() || null;
  const portalId = config.get<string>("HUBSPOT_PORTAL_ID")?.trim() || null;
  return { enabled: requested && !!token, requested, token, portalId };
}
