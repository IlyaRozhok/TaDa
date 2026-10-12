/**
 * Phone verification settings, read from the environment on every call so a
 * restart is the only thing a change needs (and tests can set them freely).
 *
 * Env (server-only):
 * - SITE_ENV                     "production" on the production host only —
 *                                the stub is refused there (see isProductionSite)
 * - OTP_PROVIDER                 "twilio" | "stub" (see otp-provider.factory.ts)
 * - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
 * - PHONE_VERIFICATION_REQUIRED  "true" turns the login gate on; default off
 * - TURNSTILE_SECRET_KEY         unset → the captcha check is skipped
 * - ALLOWED_PHONE_COUNTRIES      optional CSV of ISO codes, overrides the default
 */

type Env = Record<string, string | undefined>;

/**
 * Countries whose mobiles we verify by SMS. KEEP ALIGNED WITH THE TWILIO
 * VERIFY GEO PERMISSIONS (Twilio console → Verify → Settings → Geo
 * permissions): a country listed here but not enabled there passes our guard
 * and then fails at Twilio; one enabled there but not here is never reached.
 * Product can override the list per environment with ALLOWED_PHONE_COUNTRIES.
 */
export const DEFAULT_ALLOWED_PHONE_COUNTRIES: readonly string[] = [
  "GB", "IE", "UA", "AT", "FR", "DE", "ES", "IT", "PL", "RO",
  "PT", "NL", "HK", "IN", "CN", "NG", "ZA", "CA", "US",
];

/** The allowed ISO codes: the env override when it holds any valid code, else the default. */
export function allowedPhoneCountries(env: Env = process.env): string[] {
  const override = (env.ALLOWED_PHONE_COUNTRIES ?? "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));
  return override.length ? [...new Set(override)] : [...DEFAULT_ALLOWED_PHONE_COUNTRIES];
}

/** Whether the login gate is on: only the exact string "true" enables it. */
export const phoneVerificationRequired = (env: Env = process.env): boolean =>
  env.PHONE_VERIFICATION_REQUIRED?.trim().toLowerCase() === "true";

/**
 * Whether this user must verify before using the platform: the gate is on
 * and their phone is not verified. What `/auth/me` reports to the frontend,
 * so the browser needs no flag of its own.
 */
export const isPhoneVerificationPending = (
  user: { phone_verified_at?: Date | null } | null | undefined,
  env: Env = process.env,
): boolean => phoneVerificationRequired(env) && !user?.phone_verified_at;

/**
 * The explicit "this is real production" signal: `SITE_ENV=production`, set
 * on the production host only. It mirrors the frontend's
 * `NEXT_PUBLIC_SITE_ENV` (production on Vercel Production, nothing
 * elsewhere — see frontend/src/app/lib/siteEnv.ts). `NODE_ENV` cannot serve:
 * stage runs NODE_ENV=production too (secure cookies, JSON logs), and stage
 * must be able to run the stub.
 */
export const isProductionSite = (env: Env = process.env): boolean =>
  env.SITE_ENV?.trim().toLowerCase() === "production";

/** A deployed build — stage or production, which both run NODE_ENV=production. */
export const isDeployedBuild = (env: Env = process.env): boolean => env.NODE_ENV === "production";

/** OTP_PROVIDER as set: "twilio" or "stub" by name, null when unset or unrecognised. */
export function requestedOtpProvider(env: Env = process.env): "twilio" | "stub" | null {
  const value = env.OTP_PROVIDER?.trim().toLowerCase();
  return value === "twilio" || value === "stub" ? value : null;
}

/** The configured provider: "twilio" only when asked for by name. */
export const otpProviderName = (env: Env = process.env): "twilio" | "stub" =>
  requestedOtpProvider(env) === "twilio" ? "twilio" : "stub";

/** Twilio credentials, or the names of the ones missing. */
export function twilioCredentials(
  env: Env = process.env,
): { accountSid: string; authToken: string; serviceSid: string } | { missing: string[] } {
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = env.TWILIO_AUTH_TOKEN?.trim();
  const serviceSid = env.TWILIO_VERIFY_SERVICE_SID?.trim();
  if (accountSid && authToken && serviceSid) return { accountSid, authToken, serviceSid };
  return {
    missing: [
      ...(accountSid ? [] : ["TWILIO_ACCOUNT_SID"]),
      ...(authToken ? [] : ["TWILIO_AUTH_TOKEN"]),
      ...(serviceSid ? [] : ["TWILIO_VERIFY_SERVICE_SID"]),
    ],
  };
}
