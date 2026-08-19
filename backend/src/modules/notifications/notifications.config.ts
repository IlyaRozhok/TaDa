import { ConfigService } from "@nestjs/config";

/** Recipient used when nothing is configured. Never comes from a request. */
export const DEFAULT_NOTIFICATIONS_TO = "support@ta-da.co";

/** Stop retrying after this many failed sends; the row stays `failed` for inspection. */
export const MAX_DELIVERY_ATTEMPTS = 5;

/** First retry gap. Doubles per attempt: 2m, 4m, 8m, 16m. */
export const RETRY_BASE_DELAY_MS = 2 * 60 * 1000;

/** Rows the retry worker picks up per tick, so a backlog drains gradually. */
export const RETRY_BATCH_SIZE = 25;

export interface NotificationsConfig {
  /** Master kill switch. False means nothing is recorded and nothing is sent. */
  enabled: boolean;
  /** Per-channel switch for email. */
  emailEnabled: boolean;
  /** Fixed internal destination. */
  recipient: string;
  /** Whether a re-submitted booking request notifies again. */
  notifyOnBookingResubmit: boolean;
}

/**
 * Booleans default to ON, except where the safer default is OFF. A host that
 * sets nothing therefore behaves like the design describes; turning a switch
 * off is an explicit act, which is what makes it usable as an incident lever.
 */
function readFlag(
  config: ConfigService,
  key: string,
  fallback: boolean,
): boolean {
  const raw = config.get<string>(key);
  if (raw === undefined || raw === null || raw.trim() === "") return fallback;
  return raw.trim().toLowerCase() === "true";
}

export function readNotificationsConfig(
  config: ConfigService,
): NotificationsConfig {
  return {
    enabled: readFlag(config, "NOTIFICATIONS_ENABLED", true),
    emailEnabled: readFlag(config, "EMAIL_ENABLED", true),
    recipient:
      config.get<string>("NOTIFICATIONS_TO")?.trim() ||
      DEFAULT_NOTIFICATIONS_TO,
    notifyOnBookingResubmit: readFlag(
      config,
      "NOTIFY_ON_BOOKING_RESUBMIT",
      true,
    ),
  };
}

/** Exponential backoff for attempt N (0-based), capped so it stays inspectable. */
export function retryDelayMs(attempts: number): number {
  const capped = Math.min(attempts, 4);
  return RETRY_BASE_DELAY_MS * 2 ** capped;
}
