import type { OtpCheckResult, OtpProvider, OtpSendResult } from "./otp-provider";

/**
 * What a deployed host gets when no provider is configured: every call
 * reports the service unavailable. It exists so the stub can never run in
 * production by accident — a missing setup there means "cannot verify",
 * never "every 000000 is accepted" — without taking the whole API down on
 * boot, so a release can ship before the Twilio keys do.
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
