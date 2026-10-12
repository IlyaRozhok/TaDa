/**
 * Pure helpers for SMS phone verification: routing, the allowed-country
 * check, OTP input, and turning API errors into the message to show. The
 * screen and the gate use them; they are tested without React.
 */

/** Where an unverified user is sent while the gate is on. */
export const PHONE_VERIFICATION_PATH = "/app/verify-phone";

/** The error code the backend answers with while the gate blocks a user. */
export const PHONE_VERIFICATION_REQUIRED_CODE = "PHONE_VERIFICATION_REQUIRED";

/** Length of the SMS code. */
export const OTP_LENGTH = 6;

/**
 * Whether this user must verify before using the platform — the backend's
 * verdict from `/auth/me` (gate on and phone unverified), so the browser
 * needs no flag of its own.
 */
export const isPhoneVerificationPending = (
  user: { phone_verification_pending?: boolean } | null | undefined,
): boolean => Boolean(user?.phone_verification_pending);

/**
 * The user's SMS-verified number (E.164), or null when the phone is not
 * verified. A verified number is shown read-only in the profile forms and
 * changed only through re-verification.
 */
export const verifiedPhoneOf = (
  user: { phone?: string | null; phone_verified_at?: string | null } | null | undefined,
): string | null => (user?.phone_verified_at && user.phone ? user.phone : null);

/** The verification screen, set to come back to `returnTo` once done. */
export const phoneVerificationHref = (returnTo?: string | null): string =>
  returnTo && safeReturnPath(returnTo)
    ? `${PHONE_VERIFICATION_PATH}?return=${encodeURIComponent(returnTo)}`
    : PHONE_VERIFICATION_PATH;

/**
 * A `return` target the screen may navigate to after verifying: an in-app
 * path only (`/app/...`), never another origin (`//evil.com`, `https://…`)
 * or the screen itself. Null for anything else.
 */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/app/") || raw.startsWith("//") || raw.includes("\\")) return null;
  const path = raw.split(/[?#]/)[0];
  return path === PHONE_VERIFICATION_PATH ? null : raw;
}

/** Onboarding, where a new user verifies inline in the registration form. */
export const ONBOARDING_PATH = "/app/onboarding";

const isUnder = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/**
 * Pages the gate never redirects away from: the verification screen, sign-in,
 * and onboarding — new users verify there, inline, before saving anything.
 */
export const isPhoneVerificationExempt = (pathname: string | null | undefined): boolean =>
  !!pathname &&
  (isUnder(pathname, PHONE_VERIFICATION_PATH) || isUnder(pathname, "/app/auth") || isUnder(pathname, ONBOARDING_PATH));

/**
 * True when an API answer is the gate's 403 and the user is not already on
 * the verification screen — the fallback for a session that started before
 * the gate was turned on.
 */
export function shouldRedirectToPhoneVerification(
  status: unknown,
  data: unknown,
  pathname: string | null | undefined,
): boolean {
  return (
    status === 403 &&
    typeof data === "object" &&
    data !== null &&
    (data as { code?: unknown }).code === PHONE_VERIFICATION_REQUIRED_CODE &&
    !isPhoneVerificationExempt(pathname)
  );
}

/** Sends the browser to the verification screen when `shouldRedirect…` says so. */
export function redirectToPhoneVerificationIfRequired(status: unknown, data: unknown): void {
  if (typeof window === "undefined") return;
  if (shouldRedirectToPhoneVerification(status, data, window.location.pathname)) {
    window.location.assign(PHONE_VERIFICATION_PATH);
  }
}

/** Whether the parsed number's country is one we can verify. */
export const isPhoneCountryAllowed = (
  country: string | null | undefined,
  allowed: readonly string[] | undefined,
): boolean => !allowed || allowed.length === 0 || (!!country && allowed.includes(country));

/** "JP" → "Japan" (falls back to the code). */
export function countryDisplayName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The spec's message for a country outside the list — the same text the API returns. */
export const countryNotAllowedMessage = (code: string | null | undefined): string =>
  `We currently can't verify numbers from ${code ? countryDisplayName(code) : "this country"}. ` +
  "Please use a mobile from a supported country.";

/** Digits only, at most six — what the code field keeps of whatever is typed or pasted. */
export const sanitizeOtpInput = (value: string): string => value.replace(/\D/g, "").slice(0, OTP_LENGTH);

export const isCompleteOtp = (value: string): boolean => new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value);

/** 45 → "0:45", 75 → "1:15". */
export const formatCountdown = (seconds: number): string => {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
};

export interface PhoneVerificationError {
  code?: string;
  message: string;
  retryAfterSeconds?: number;
  attemptsRemaining?: number;
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/**
 * An RTK Query error from the phone endpoints as something to show. The API
 * sends `{ code, message }` with an English message meant for the screen; a
 * validation error sends `message` as a list; anything else gets a generic
 * line rather than a status code.
 */
export function phoneVerificationError(error: unknown): PhoneVerificationError {
  const data =
    typeof error === "object" && error !== null && "data" in error
      ? (error as { data?: unknown }).data
      : undefined;
  if (typeof data !== "object" || data === null) return { message: FALLBACK_MESSAGE };

  const body = data as {
    code?: unknown;
    message?: unknown;
    retryAfterSeconds?: unknown;
    attemptsRemaining?: unknown;
  };
  const message = Array.isArray(body.message)
    ? body.message.filter((m) => typeof m === "string").join(" ")
    : typeof body.message === "string"
      ? body.message
      : "";

  return {
    code: typeof body.code === "string" ? body.code : undefined,
    message: message || FALLBACK_MESSAGE,
    retryAfterSeconds: typeof body.retryAfterSeconds === "number" ? body.retryAfterSeconds : undefined,
    attemptsRemaining: typeof body.attemptsRemaining === "number" ? body.attemptsRemaining : undefined,
  };
}
