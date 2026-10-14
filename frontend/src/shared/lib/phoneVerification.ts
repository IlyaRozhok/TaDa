import { phoneVerificationKeys as K } from "@/app/lib/translationsKeys/phoneVerificationKeys";
import type { PhoneIssue } from "@/shared/lib/phone";

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
 * Whether the forms offer SMS verification at all: only with the gate on
 * (the server's PHONE_VERIFICATION_REQUIRED, from /auth/phone/config, or a
 * user /auth/me reports as pending). Off — or not yet known, or the config
 * failed to load — the forms show a plain optional phone field and can never
 * send a code.
 */
export const isPhoneVerificationRequired = (
  config: { verificationRequired?: boolean } | null | undefined,
  user: { phone_verification_pending?: boolean } | null | undefined,
): boolean => config?.verificationRequired === true || isPhoneVerificationPending(user);

/**
 * The user's SMS-verified number (E.164), or null when the phone is not
 * verified. A verified number is shown read-only in the profile forms and
 * changed only through re-verification.
 */
export const verifiedPhoneOf = (
  user: { phone?: string | null; phone_verified_at?: string | null } | null | undefined,
): string | null => (user?.phone_verified_at && user.phone ? user.phone : null);

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

/**
 * A translated sentence without its closing full stop (Latin ".", CJK "。",
 * Devanagari "।"), so a ": <number>" can follow it on the code step.
 */
export const withoutClosingStop = (text: string): string => text.replace(/\s*[.。।]\s*$/u, "");

/** Digits only, at most six — what the code field keeps of whatever is typed or pasted. */
export const sanitizeOtpInput = (value: string): string => value.replace(/\D/g, "").slice(0, OTP_LENGTH);

export const isCompleteOtp = (value: string): boolean => new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value);

/** 45 → "0:45", 75 → "1:15". */
export const formatCountdown = (seconds: number): string => {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
};

export interface PhoneVerificationProblem {
  /** Translation key of the text to show — never the API's own wording. */
  key: string;
  /** The API's stable error code, when it sent one. */
  code?: string;
  /** Seconds until a code may be sent again (rate-limit answers). */
  retryAfterSeconds?: number;
}

/** Key for a number the client-side check refuses (shared rules, phone.ts). */
export function phoneIssueKey(issue: PhoneIssue): string {
  switch (issue) {
    case "EMPTY":
      return K.error.empty;
    case "TOO_SHORT":
      return K.error.tooShort;
    case "TOO_LONG":
      return K.error.tooLong;
    // Junk that is not a number at all reads as "enter a mobile number" too:
    // the copy has no separate line for it.
    case "NOT_MOBILE":
    case "INVALID":
      return K.error.notMobile;
  }
}

const isIssue = (value: unknown): value is PhoneIssue =>
  value === "EMPTY" || value === "TOO_SHORT" || value === "TOO_LONG" || value === "NOT_MOBILE" || value === "INVALID";

/**
 * Any failure of the phone endpoints — or of the network — as a translation
 * key. The API answers `{ code, reason?, retryAfterSeconds? }` with stable
 * codes; this maps them, so no server wording ("ThrottlerException: Too Many
 * Requests") can reach the screen. Anything unrecognised is the generic
 * network message.
 *
 * `step` disambiguates the one code shared by both calls:
 * VERIFICATION_UNAVAILABLE is a failed send on "send", a generic failure on
 * "verify".
 */
export function phoneVerificationProblem(error: unknown, step: "send" | "verify" = "send"): PhoneVerificationProblem {
  const err = typeof error === "object" && error !== null ? (error as { status?: unknown; data?: unknown }) : {};
  const body =
    typeof err.data === "object" && err.data !== null
      ? (err.data as { code?: unknown; reason?: unknown; retryAfterSeconds?: unknown })
      : {};
  const code = typeof body.code === "string" ? body.code : undefined;
  const retryAfterSeconds = typeof body.retryAfterSeconds === "number" ? body.retryAfterSeconds : undefined;
  const problem = (key: string): PhoneVerificationProblem => ({ key, code, retryAfterSeconds });

  switch (code) {
    case "RATE_LIMITED":
    case "RESEND_TOO_SOON":
    case "TOO_MANY_SENDS":
      return problem(K.error.rateLimited);
    case "PHONE_TAKEN":
      return problem(K.error.alreadyLinked);
    case "SEND_FAILED":
      return problem(K.error.sendFailed);
    case "VERIFICATION_UNAVAILABLE":
      return problem(step === "send" ? K.error.sendFailed : K.commonErrorNetwork);
    case "CODE_INVALID":
      return problem(K.code.errorIncorrect);
    case "TOO_MANY_ATTEMPTS":
      return problem(K.code.errorAttemptsExceeded);
    case "CODE_EXPIRED":
      return problem(K.code.errorExpired);
    case "PHONE_INVALID":
      return problem(phoneIssueKey(isIssue(body.reason) ? body.reason : "INVALID"));
    case "PHONE_COUNTRY_NOT_ALLOWED":
      return problem(K.error.countryUnsupported);
  }

  // A throttled request from any layer, even one without our code.
  if (err.status === 429) return problem(K.error.rateLimited);
  return problem(K.commonErrorNetwork);
}
