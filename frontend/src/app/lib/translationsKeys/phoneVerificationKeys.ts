/**
 * Translation keys of the phone verification UI — the standalone
 * /app/verify-phone screen and the inline flow in the onboarding form. The
 * components reference these keys only; no visible text is written in them.
 *
 * Localazy owns the values (src/translations/*.json, never edited by hand).
 * The British-English values below are the approved copy and serve only as
 * the fallback for a key Localazy has not synced yet (translateWithFallback):
 * as of 2026-10-13 that is `phone.error.not.mobile` and
 * `phone.error.country.unsupported`; every other key is already in Localazy
 * in all languages.
 */
export const phoneVerificationKeys = {
  verify: {
    title: "phone.verify.title",
    subtitle: "phone.verify.subtitle",
    numberLabel: "phone.verify.number.label",
    sendCode: "phone.verify.send.code",
    sending: "phone.verify.sending",
  },
  code: {
    subtitle: "phone.code.subtitle",
    confirm: "phone.code.confirm",
    verifying: "phone.code.verifying",
    changeNumber: "phone.code.change.number",
    /** Followed by the countdown, rendered as a separate element. */
    resendIn: "phone.code.resend",
    sent: "phone.code.sent",
    success: "phone.code.success",
    errorIncorrect: "phone.code.error.incorrect",
    errorAttemptsExceeded: "phone.code.error.attempts.exceeded",
    errorExpired: "phone.code.error.expired",
  },
  error: {
    empty: "phone.error.empty",
    tooShort: "phone.error.too.short",
    tooLong: "phone.error.too.long",
    notMobile: "phone.error.not.mobile",
    rateLimited: "phone.error.rate.limited",
    alreadyLinked: "phone.error.already.linked",
    sendFailed: "phone.error.send.failed",
    countryUnsupported: "phone.error.country.unsupported",
  },
  status: {
    verified: "phone.status.verified",
  },
  commonErrorNetwork: "common.error.network",
} as const;

/** Approved British-English copy, used only while a key is missing from Localazy. */
export const PHONE_VERIFICATION_FALLBACKS: Readonly<Record<string, string>> = {
  "phone.verify.title": "Verify your mobile number",
  "phone.verify.subtitle": "We'll text you a 6-digit code to confirm it's yours.",
  "phone.verify.number.label": "Mobile number",
  "phone.verify.send.code": "Send code",
  "phone.verify.sending": "Sending…",
  "phone.code.subtitle": "Enter the 6-digit code we've sent to your mobile.",
  "phone.code.confirm": "Confirm",
  "phone.code.verifying": "Checking…",
  "phone.code.change.number": "Change number",
  "phone.code.resend": "Resend code in",
  "phone.code.sent": "We've sent a new code.",
  "phone.code.success": "Your number is verified.",
  "phone.code.error.incorrect": "Incorrect code. Please try again.",
  "phone.code.error.attempts.exceeded": "Too many incorrect attempts. Please request a new code.",
  "phone.code.error.expired": "This code has expired. Please request a new one.",
  "phone.error.empty": "Please enter your mobile number.",
  "phone.error.too.short": "This number is too short. Please check it.",
  "phone.error.too.long": "This number is too long. Please check it.",
  "phone.error.not.mobile": "Please enter a mobile number.",
  "phone.error.rate.limited": "Too many attempts. Please wait a few minutes and try again.",
  "phone.error.already.linked": "This number is already linked to another account.",
  "phone.error.send.failed": "We couldn't send the code. Please try again.",
  "phone.error.country.unsupported": "We can't verify numbers from this country yet. Please use a supported country.",
  "phone.status.verified": "Verified",
  "common.error.network": "Something went wrong. Please check your connection and try again.",
};
