/**
 * Analytics consent (GDPR / PECR).
 *
 * Analytics cookies are non-essential, so under PECR they need opt-in consent
 * before anything is loaded — not a notice after the fact. This module owns the
 * stored decision; `ga.ts` reads it as one more link in its guard chain and
 * `CookieConsentBanner` writes it.
 *
 * There is exactly one stored decision, the one the cookie banner has always
 * written (`tada_cookie_consent_v1` / `tada_cookie_consent`, "accepted" or
 * "rejected"). Analytics consent is derived from it rather than kept in a second
 * key, so the banner and GA4 can never disagree about what the user chose.
 *
 * Defaults to "unset" — never to granted — so a user who has not answered yet,
 * or whose storage is unreadable, gets no analytics.
 */

/** What the banner stores. Kept as-is: users already have these values. */
export type CookieConsentDecision = "accepted" | "rejected";

/** What analytics asks for. "unset" means the banner has not been answered. */
export type AnalyticsConsent = "granted" | "denied" | "unset";

/** Mirrored in localStorage and a first-party cookie; either one is enough. */
export const CONSENT_STORAGE_KEY = "tada_cookie_consent_v1";
export const CONSENT_COOKIE_KEY = "tada_cookie_consent";

const CONSENT_MAX_AGE_DAYS = 365;

/** Fired on this tab when the decision changes. */
export const CONSENT_CHANGED_EVENT = "tada:cookieConsentChanged";

/** Fired to reopen the banner so a decision can be changed. */
export const CONSENT_REOPEN_EVENT = "tada:openCookieSettings";

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const encodedName = encodeURIComponent(name);
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${encodedName}=([^;]*)`),
  );

  if (!match) return null;
  try {
    return decodeURIComponent(match[1] ?? "");
  } catch {
    return match[1] ?? null;
  }
}

function writeCookieValue(name: string, value: string) {
  if (typeof document === "undefined") return;

  const maxAgeSeconds = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  const isSecure = window.location.protocol === "https:";

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value,
  )}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`;
}

/**
 * The stored decision, or null if the user has not answered.
 *
 * localStorage wins over the cookie: the cookie is the fallback for browsers
 * that refuse localStorage, and it is the copy that can be dropped by a
 * cleanup tool while the localStorage value survives.
 */
export function readConsentDecision(): CookieConsentDecision | null {
  if (typeof window === "undefined") return null;

  let stored: string | null = null;

  try {
    stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    // localStorage can be unavailable (private mode, blocked storage).
  }

  const raw = stored ?? readCookieValue(CONSENT_COOKIE_KEY);

  return raw === "accepted" || raw === "rejected" ? raw : null;
}

/** The stored decision as analytics sees it. Unknown or absent => "unset". */
export function readAnalyticsConsent(): AnalyticsConsent {
  const decision = readConsentDecision();

  if (decision === "accepted") return "granted";
  if (decision === "rejected") return "denied";

  return "unset";
}

/** True once the user has answered the banner, either way. */
export function hasConsentDecision(): boolean {
  return readConsentDecision() !== null;
}

/**
 * Stores the decision in both places and tells this tab about it.
 *
 * The event is what lets `AnalyticsProvider` load gtag.js the moment Accept is
 * pressed, instead of waiting for the next navigation.
 */
export function persistConsentDecision(decision: CookieConsentDecision): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, decision);
  } catch {
    // localStorage can be unavailable (private mode, blocked storage).
  }

  writeCookieValue(CONSENT_COOKIE_KEY, decision);

  window.dispatchEvent(
    new CustomEvent(CONSENT_CHANGED_EVENT, { detail: { decision } }),
  );
}

/**
 * Subscribes to consent changes in this tab and in other tabs.
 *
 * Returns the unsubscribe function.
 */
export function subscribeToConsentChanges(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CONSENT_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener(CONSENT_CHANGED_EVENT, listener);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Reopens the banner so the user can change an answer they already gave. */
export function openCookieSettings(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(CONSENT_REOPEN_EVENT));
}
