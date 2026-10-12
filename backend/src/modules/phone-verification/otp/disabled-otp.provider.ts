import type { OtpCheckResult, OtpProvider, OtpSendResult } from "./otp-provider";

/**
 * What production gets when no real provider is configured: every call
 * reports the service unavailable. It exists so the stub can never run in
 * production — a missing Twilio setup there means "cannot verify", never
 * "every 000000 is accepted" — without taking the whole API down on boot.
 */
export class DisabledOtpProvider implements OtpProvider {
  readonly name = "disabled";

  async sendCode(): Promise<OtpSendResult> {
    return { status: "failed", reason: "unavailable" };
  }

  async checkCode(): Promise<OtpCheckResult> {
    return { status: "failed", reason: "unavailable" };
  }
}
