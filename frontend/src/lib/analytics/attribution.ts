/**
 * Google Ads click attribution that survives the OAuth round trip.
 *
 * A paid visitor lands on `/?gclid=...&utm_source=google&...`. Signing in sends
 * the browser to the backend, on to accounts.google.com and back to
 * `/app/auth/callback?...` — a full-page navigation off the origin and back,
 * with a query string the backend composes. Nothing of the original one
 * survives it, so by the time `sign_up` fires the click that paid for the
 * conversion is no longer visible anywhere in the URL.
 *
 * So the parameters are read on the *first* load, before anything can redirect,
 * and kept here.
 *
 * ## Cookie, not localStorage
 *
 * A first-party cookie is what this uses. localStorage would survive the same
 * redirect chain (it is per-origin and the origin is unchanged), but the cookie
 * is the more durable of the two in practice: it is not cleared by the "clear
 * site data on close" settings that drop web storage first, it is readable
 * server-side if attribution ever has to be stamped on a record at sign-up
 * time, and it degrades to "no attribution" rather than to a thrown exception
 * in the private-mode configurations where localStorage access throws.
 *
 * 90 days matches the Google Ads conversion window, so a stored click stops
 * being claimed at the same moment Ads stops counting it.
 *
 * ## What is stored
 *
 * `gclid` and the five `utm_*` parameters, nothing else — no PII: these are the
 * campaign strings the advertiser wrote plus an opaque click id. Values are
 * trimmed and capped, and empty ones are never stored.
 *
 * ## When the stored set is replaced
 *
 * First-touch, with one exception. The earliest stored set wins, so a visitor
 * who arrives from an ad and then wanders back through an organic link still
 * converts against the ad. The exception is a *new* `gclid`: a different click
 * id is a different paid click and it takes the attribution with it, replacing
 * the whole stored set rather than merging into it — mixing the utm parameters
 * of one campaign with the click id of another would report a campaign that
 * never happened.
 */

import { readCookie, writeCookie } from "./cookies";

/** The parameters carried through. `gclid` is the Google Ads click id. */
export const ATTRIBUTION_KEYS = [
  "gclid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];

/** A stored or incoming attribution set. Absent keys were never present. */
export type Attribution = Partial<Record<AttributionKey, string>>;

/** First-party, script-readable, 90 days. */
export const ATTRIBUTION_COOKIE_KEY = "tada_attribution_v1";

/** The Google Ads conversion window. */
export const ATTRIBUTION_MAX_AGE_DAYS = 90;

/**
 * Longest value stored per parameter.
 *
 * A gclid is ~100 characters and utm values are campaign names; anything longer
 * is junk or an injection attempt, and the cookie has a size budget to keep.
 */
const MAX_VALUE_LENGTH = 256;

function normalizeValue(raw: string | null | undefined): string | undefined {
  const trimmed = raw?.trim();

  return trimmed ? trimmed.slice(0, MAX_VALUE_LENGTH) : undefined;
}

/**
 * Picks the attribution parameters out of a query string.
 *
 * Accepts what `useSearchParams().toString()` returns as well as a raw
 * `location.search` with its leading `?`. Empty parameters (`?utm_source=`) are
 * dropped here, which is what keeps them from ever reaching storage.
 */
export function readAttributionFromSearch(search: string): Attribution {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );

  const found: Attribution = {};

  for (const key of ATTRIBUTION_KEYS) {
    const value = normalizeValue(params.get(key));

    if (value) {
      found[key] = value;
    }
  }

  return found;
}

/** True when the set carries nothing worth storing. */
export function isEmptyAttribution(attribution: Attribution): boolean {
  return ATTRIBUTION_KEYS.every((key) => !attribution[key]);
}

/**
 * The stored set, or null when there is none or it cannot be read.
 *
 * Unknown keys in the cookie are ignored rather than trusted: the cookie is
 * user-writable, and only the six keys above may reach GA4.
 */
export function readStoredAttribution(): Attribution | null {
  const raw = readCookie(ATTRIBUTION_COOKIE_KEY);

  if (!raw) return null;

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    // A cookie mangled by hand or by another tool. Treated as absent.
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;

  const source = parsed as Record<string, unknown>;
  const stored: Attribution = {};

  for (const key of ATTRIBUTION_KEYS) {
    const value = source[key];

    if (typeof value === "string") {
      const normalized = normalizeValue(value);

      if (normalized) {
        stored[key] = normalized;
      }
    }
  }

  return isEmptyAttribution(stored) ? null : stored;
}

/** Writes the set as the whole stored value. Replaces, never merges. */
export function writeStoredAttribution(attribution: Attribution): void {
  writeCookie(
    ATTRIBUTION_COOKIE_KEY,
    JSON.stringify(attribution),
    ATTRIBUTION_MAX_AGE_DAYS,
  );
}

/**
 * What the stored set should become, or null when it must be left alone.
 *
 * The whole overwrite policy, as a pure function — see the module comment for
 * why it is first-touch except on a new click id.
 */
export function nextAttribution(
  stored: Attribution | null,
  incoming: Attribution,
): Attribution | null {
  // Nothing in the URL: never clear or blank out what is already stored.
  if (isEmptyAttribution(incoming)) {
    return null;
  }

  if (!stored || isEmptyAttribution(stored)) {
    return incoming;
  }

  // A different click id means a different paid click, and it brings its own
  // campaign with it. Same id, or no id at all, leaves the first touch alone.
  if (incoming.gclid && incoming.gclid !== stored.gclid) {
    return incoming;
  }

  return null;
}

/**
 * Reads the URL and updates storage if the policy says to. Returns the set that
 * is stored afterwards.
 *
 * Runs on every navigation, on every environment — the capture is deliberately
 * not behind the GA4 production guard, so the same code path can be observed on
 * staging, and so a visitor who lands on a campaign URL is attributed even if
 * gtag.js is slow or blocked. Only *sending* the values to GA4 is gated.
 */
export function captureAttribution(search: string): Attribution | null {
  if (typeof document === "undefined") return null;

  const stored = readStoredAttribution();
  const next = nextAttribution(stored, readAttributionFromSearch(search));

  if (!next) {
    return stored;
  }

  writeStoredAttribution(next);

  return next;
}
