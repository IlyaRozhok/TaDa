import { Logger } from "@nestjs/common";

import type { OtpCheckResult, OtpProvider, OtpSendResult } from "./otp-provider";

/** The one code the stub accepts, for every number. */
export const STUB_OTP_CODE = "000000";

/**
 * Development stand-in for Twilio Verify: sends nothing and accepts
 * `000000` for any number. The factory never builds it in production — there
 * a missing real provider means verification is unavailable, never faked.
 */
export class StubOtpProvider implements OtpProvider {
  readonly name = "stub";
  private readonly logger = new Logger(StubOtpProvider.name);

  async sendCode(phoneE164: string): Promise<OtpSendResult> {
    // Masked number only. No code is logged, not even the stub's fixed one:
    // a log line carrying a code is the habit this rule exists to prevent.
    this.logger.warn(`STUB OTP provider: no SMS sent to ${maskPhone(phoneE164)}`);
    return { status: "sent" };
  }

  async checkCode(_phoneE164: string, code: string): Promise<OtpCheckResult> {
    return code === STUB_OTP_CODE
      ? { status: "approved" }
      : { status: "pending", reason: "invalid_code" };
  }
}

/** "+447123456789" → "+44*******789": enough to tell numbers apart in a log. */
export const maskPhone = (phone: string): string =>
  phone.length <= 6 ? "***" : `${phone.slice(0, 3)}${"*".repeat(phone.length - 6)}${phone.slice(-3)}`;
