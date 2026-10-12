import { Logger } from "@nestjs/common";

import {
  isProduction,
  otpProviderName,
  phoneVerificationRequired,
  twilioCredentials,
} from "../phone-verification.config";
import { DisabledOtpProvider } from "./disabled-otp.provider";
import type { OtpProvider } from "./otp-provider";
import { StubOtpProvider } from "./stub-otp.provider";
import { TwilioVerifyOtpProvider, type TwilioVerifyClient } from "./twilio-verify-otp.provider";

type Env = Record<string, string | undefined>;

/**
 * Builds the OTP provider from the environment.
 *
 * - `OTP_PROVIDER=twilio` → Twilio Verify. Missing credentials refuse to
 *   start: the operator asked for Twilio explicitly, and silently falling back
 *   would hide the misconfiguration.
 * - anything else → the stub, OUTSIDE production only.
 * - in production (`NODE_ENV=production`) the stub is never built. Without
 *   Twilio, verification is disabled (every call answers 503) — the app still
 *   boots, because stage shares NODE_ENV=production and must keep deploying
 *   before Twilio keys exist.
 * - production + `PHONE_VERIFICATION_REQUIRED=true` without Twilio refuses to
 *   start: the gate would lock every user out with no way to verify.
 */
export function createOtpProvider(
  env: Env = process.env,
  twilioClient?: TwilioVerifyClient,
): OtpProvider {
  const logger = new Logger("OtpProvider");

  if (otpProviderName(env) === "twilio") {
    const credentials = twilioCredentials(env);
    if ("missing" in credentials) {
      throw new Error(
        `OTP_PROVIDER=twilio but ${credentials.missing.join(", ")} ${credentials.missing.length === 1 ? "is" : "are"} not set`,
      );
    }
    logger.log("OTP provider: Twilio Verify");
    return new TwilioVerifyOtpProvider(credentials, twilioClient);
  }

  if (isProduction(env)) {
    if (phoneVerificationRequired(env)) {
      throw new Error(
        "PHONE_VERIFICATION_REQUIRED=true in production needs OTP_PROVIDER=twilio with its credentials; " +
          "refusing to start rather than lock every user out",
      );
    }
    logger.error(
      "OTP provider: none — production never uses the stub. Phone verification is unavailable until OTP_PROVIDER=twilio is configured.",
    );
    return new DisabledOtpProvider();
  }

  logger.warn("OTP provider: STUB (development only) — no SMS is sent, code 000000 is accepted");
  return new StubOtpProvider();
}
