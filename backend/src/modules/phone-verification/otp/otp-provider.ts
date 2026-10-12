/**
 * A one-time-code SMS service, kept vendor-agnostic so Twilio Verify can be
 * swapped (or stubbed) without touching the verification flow. A provider
 * generates, delivers, expires and checks codes itself: the application never
 * sees a code except the one the user types, and never logs or stores it.
 */

export const OTP_PROVIDER = Symbol("OTP_PROVIDER");

export type OtpChannel = "sms";

export type OtpSendResult =
  | { status: "sent" }
  | { status: "failed"; reason: "invalid_number" | "rate_limited" | "unavailable" | "provider_error" };

export type OtpCheckResult =
  /** The code matched; the number is verified. */
  | { status: "approved" }
  /** A wrong code; the verification is still open for another try. */
  | { status: "pending"; reason: "invalid_code" }
  /** No open verification any more — expired, used up, or never sent. */
  | { status: "failed"; reason: "expired" | "too_many_attempts" | "unavailable" | "provider_error" };

export interface OtpProvider {
  /** Name for logs and health output. */
  readonly name: string;
  sendCode(phoneE164: string, channel?: OtpChannel): Promise<OtpSendResult>;
  checkCode(phoneE164: string, code: string): Promise<OtpCheckResult>;
}
