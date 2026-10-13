import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Every failure of the verification endpoints, as `{ statusCode, code,
 * message, ...details }`: `code` is stable for the client to branch on,
 * `message` is the English text the screen shows as-is.
 */
export type PhoneVerificationErrorCode =
  | "PHONE_INVALID"
  | "PHONE_COUNTRY_NOT_ALLOWED"
  | "PHONE_TAKEN"
  | "CAPTCHA_FAILED"
  | "RESEND_TOO_SOON"
  | "TOO_MANY_SENDS"
  | "SEND_FAILED"
  | "VERIFICATION_UNAVAILABLE"
  | "CODE_INVALID"
  | "CODE_EXPIRED"
  | "TOO_MANY_ATTEMPTS"
  | "PHONE_VERIFICATION_REQUIRED";

export class PhoneVerificationError extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: PhoneVerificationErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super({ statusCode: status, code, message, ...details }, status);
  }
}

/** "GB" → "United Kingdom", for the not-allowed message. */
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Why a number was refused — machine-readable, alongside the English
 * message, so the client shows its own translated text for each case.
 */
export type PhoneInvalidReason = "EMPTY" | "TOO_SHORT" | "TOO_LONG" | "NOT_MOBILE" | "INVALID";

export const PhoneVerificationErrors = {
  invalid: (reason: PhoneInvalidReason, message: string) =>
    new PhoneVerificationError(HttpStatus.BAD_REQUEST, "PHONE_INVALID", message, { reason }),

  countryNotAllowed: (country: string) =>
    new PhoneVerificationError(
      HttpStatus.BAD_REQUEST,
      "PHONE_COUNTRY_NOT_ALLOWED",
      `We currently can't verify numbers from ${countryName(country)}. Please use a mobile from a supported country.`,
      { country },
    ),

  taken: () =>
    new PhoneVerificationError(
      HttpStatus.CONFLICT,
      "PHONE_TAKEN",
      "This number is already linked to another account.",
    ),

  captchaFailed: () =>
    new PhoneVerificationError(
      HttpStatus.BAD_REQUEST,
      "CAPTCHA_FAILED",
      "Please complete the security check and try again.",
    ),

  resendTooSoon: (retryAfterSeconds: number) =>
    new PhoneVerificationError(
      HttpStatus.TOO_MANY_REQUESTS,
      "RESEND_TOO_SOON",
      `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
      { retryAfterSeconds },
    ),

  tooManySends: (retryAfterSeconds: number) =>
    new PhoneVerificationError(
      HttpStatus.TOO_MANY_REQUESTS,
      "TOO_MANY_SENDS",
      "Too many codes requested. Please try again later.",
      { retryAfterSeconds },
    ),

  sendFailed: () =>
    new PhoneVerificationError(
      HttpStatus.BAD_REQUEST,
      "SEND_FAILED",
      "We couldn't send a code to this number. Please check it and try again.",
    ),

  unavailable: () =>
    new PhoneVerificationError(
      HttpStatus.SERVICE_UNAVAILABLE,
      "VERIFICATION_UNAVAILABLE",
      "Phone verification is temporarily unavailable. Please try again later.",
    ),

  codeInvalid: (attemptsRemaining: number) =>
    new PhoneVerificationError(
      HttpStatus.BAD_REQUEST,
      "CODE_INVALID",
      attemptsRemaining === 1
        ? "That code is incorrect. 1 attempt left."
        : `That code is incorrect. ${attemptsRemaining} attempts left.`,
      { attemptsRemaining },
    ),

  codeExpired: () =>
    new PhoneVerificationError(
      HttpStatus.BAD_REQUEST,
      "CODE_EXPIRED",
      "This code has expired. Please request a new one.",
    ),

  tooManyAttempts: () =>
    new PhoneVerificationError(
      HttpStatus.TOO_MANY_REQUESTS,
      "TOO_MANY_ATTEMPTS",
      "Too many incorrect attempts. Please request a new code.",
    ),

  verificationRequired: () =>
    new PhoneVerificationError(
      HttpStatus.FORBIDDEN,
      "PHONE_VERIFICATION_REQUIRED",
      "Please verify your phone number to continue.",
    ),
};
