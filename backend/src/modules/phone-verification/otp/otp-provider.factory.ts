import { Logger } from "@nestjs/common";

import {
  isDeployedBuild,
  isProductionSite,
  phoneVerificationRequired,
  requestedOtpProvider,
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
 * Real production is identified by the explicit `SITE_ENV=production` — never
 * by NODE_ENV, which stage shares. In order:
 *
 * 1. `OTP_PROVIDER=twilio` → Twilio Verify, anywhere. Missing credentials
 *    refuse to start: Twilio was asked for by name.
 * 2. `SITE_ENV=production` → the stub is never used. `OTP_PROVIDER=stub`
 *    there refuses to start; with the provider unset, verification is
 *    disabled (503) so a release can ship before the Twilio keys do.
 * 3. any other deployed host (`NODE_ENV=production`, i.e. stage) → the stub
 *    only when asked for by name, `OTP_PROVIDER=stub`; unset means disabled.
 *    A fail-safe: a production host that lost its SITE_ENV must not quietly
 *    accept 000000 for every number.
 * 4. local / test → the stub unless Twilio is asked for.
 *
 * And whatever the host: the gate on (`PHONE_VERIFICATION_REQUIRED=true`)
 * with verification disabled refuses to start — it would lock every user out
 * with no way to verify.
 */
export function createOtpProvider(
  env: Env = process.env,
  twilioClient?: TwilioVerifyClient,
): OtpProvider {
  const logger = new Logger("OtpProvider");
  const requested = requestedOtpProvider(env);

  if (requested === "twilio") {
    const credentials = twilioCredentials(env);
    if ("missing" in credentials) {
      throw new Error(
        `OTP_PROVIDER=twilio but ${credentials.missing.join(", ")} ${credentials.missing.length === 1 ? "is" : "are"} not set`,
      );
    }
    logger.log("OTP provider: Twilio Verify");
    return new TwilioVerifyOtpProvider(credentials, twilioClient);
  }

  let provider: OtpProvider;
  if (isProductionSite(env)) {
    if (requested === "stub") {
      throw new Error(
        "OTP_PROVIDER=stub with SITE_ENV=production: the stub (which accepts 000000 for any number) " +
          "is never allowed in production; refusing to start",
      );
    }
    provider = new DisabledOtpProvider();
  } else if (isDeployedBuild(env) && requested !== "stub") {
    provider = new DisabledOtpProvider();
  } else {
    provider = new StubOtpProvider();
  }

  if (provider instanceof DisabledOtpProvider) {
    if (phoneVerificationRequired(env)) {
      throw new Error(
        "PHONE_VERIFICATION_REQUIRED=true but no OTP provider is available " +
          "(set OTP_PROVIDER=twilio with its credentials" +
          (isProductionSite(env) ? "" : ", or OTP_PROVIDER=stub outside production") +
          "); refusing to start rather than lock every user out",
      );
    }
    logger.error(
      "OTP provider: none — phone verification answers 503 until OTP_PROVIDER is configured" +
        (isProductionSite(env) ? " (twilio; the stub is never used with SITE_ENV=production)" : ""),
    );
    return provider;
  }

  logger.warn("OTP provider: STUB — no SMS is sent and code 000000 is accepted (never in production)");
  return provider;
}
