import { Logger } from "@nestjs/common";
import { Twilio } from "twilio";

import type { OtpChannel, OtpCheckResult, OtpProvider, OtpSendResult } from "./otp-provider";
import { maskPhone } from "./stub-otp.provider";

/**
 * Twilio error codes this provider translates. Anything else is a
 * `provider_error`, logged with its code (never with the OTP).
 * https://www.twilio.com/docs/api/errors
 */
const TWILIO_ERRORS = {
  NOT_FOUND: 20404, // no pending verification: expired, approved, or never sent
  INVALID_PARAMETER: 60200, // e.g. a number Twilio will not accept
  MAX_CHECK_ATTEMPTS: 60202,
  MAX_SEND_ATTEMPTS: 60203,
  LANDLINE: 60205, // SMS is not supported by landline
  GEO_PERMISSION: 60605, // the country is not enabled in the Verify service
  FRAUD_BLOCK: 60410,
} as const;

/** The slice of the Twilio client this provider uses — what the tests mock. */
export interface TwilioVerifyClient {
  verify: {
    v2: {
      services(sid: string): {
        verifications: { create(opts: { to: string; channel: string }): Promise<{ status: string }> };
        verificationChecks: { create(opts: { to: string; code: string }): Promise<{ status: string }> };
      };
    };
  };
}

const errorCode = (error: unknown): number | undefined =>
  typeof error === "object" && error !== null && "code" in error
    ? Number((error as { code: unknown }).code)
    : undefined;

/**
 * Twilio Verify: Twilio generates the code, sends it, expires it (10 minutes
 * by default) and counts the attempts — nothing about the code ever touches
 * our database or logs.
 */
export class TwilioVerifyOtpProvider implements OtpProvider {
  readonly name = "twilio";
  private readonly logger = new Logger(TwilioVerifyOtpProvider.name);
  private readonly client: TwilioVerifyClient;

  constructor(
    private readonly config: { accountSid: string; authToken: string; serviceSid: string },
    client?: TwilioVerifyClient,
  ) {
    this.client = client ?? (new Twilio(config.accountSid, config.authToken) as unknown as TwilioVerifyClient);
  }

  private get service() {
    return this.client.verify.v2.services(this.config.serviceSid);
  }

  async sendCode(phoneE164: string, channel: OtpChannel = "sms"): Promise<OtpSendResult> {
    try {
      await this.service.verifications.create({ to: phoneE164, channel });
      return { status: "sent" };
    } catch (error) {
      const code = errorCode(error);
      if (code === TWILIO_ERRORS.MAX_SEND_ATTEMPTS) return { status: "failed", reason: "rate_limited" };
      if (
        code === TWILIO_ERRORS.INVALID_PARAMETER ||
        code === TWILIO_ERRORS.LANDLINE ||
        code === TWILIO_ERRORS.GEO_PERMISSION ||
        code === TWILIO_ERRORS.FRAUD_BLOCK
      ) {
        this.logger.warn(`Twilio refused to send to ${maskPhone(phoneE164)} (error ${code})`);
        return { status: "failed", reason: "invalid_number" };
      }
      this.logger.error(`Twilio send failed for ${maskPhone(phoneE164)} (error ${code ?? "unknown"})`);
      return { status: "failed", reason: "provider_error" };
    }
  }

  async checkCode(phoneE164: string, code: string): Promise<OtpCheckResult> {
    try {
      const check = await this.service.verificationChecks.create({ to: phoneE164, code });
      if (check.status === "approved") return { status: "approved" };
      if (check.status === "pending") return { status: "pending", reason: "invalid_code" };
      // "canceled" / "expired" / "max_attempts_reached": nothing left to check.
      return check.status === "max_attempts_reached"
        ? { status: "failed", reason: "too_many_attempts" }
        : { status: "failed", reason: "expired" };
    } catch (error) {
      const twilioCode = errorCode(error);
      if (twilioCode === TWILIO_ERRORS.NOT_FOUND) return { status: "failed", reason: "expired" };
      if (twilioCode === TWILIO_ERRORS.MAX_CHECK_ATTEMPTS) {
        return { status: "failed", reason: "too_many_attempts" };
      }
      this.logger.error(`Twilio check failed for ${maskPhone(phoneE164)} (error ${twilioCode ?? "unknown"})`);
      return { status: "failed", reason: "provider_error" };
    }
  }
}
