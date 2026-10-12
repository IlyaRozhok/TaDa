import { describe, expect, it } from "vitest";

import {
  PHONE_VERIFICATION_PATH,
  countryNotAllowedMessage,
  formatCountdown,
  isCompleteOtp,
  isPhoneCountryAllowed,
  isPhoneVerificationExempt,
  isPhoneVerificationPending,
  phoneVerificationError,
  phoneVerificationHref,
  safeReturnPath,
  sanitizeOtpInput,
  shouldRedirectToPhoneVerification,
  verifiedPhoneOf,
} from "../phoneVerification";

const ALLOWED = ["GB", "IE", "UA", "FR", "US"];

describe("the gate's verdict", () => {
  it("follows phone_verification_pending from /auth/me", () => {
    expect(isPhoneVerificationPending({ phone_verification_pending: true })).toBe(true);
    expect(isPhoneVerificationPending({ phone_verification_pending: false })).toBe(false);
    // Flag off on the server, or an older backend: the field is absent.
    expect(isPhoneVerificationPending({})).toBe(false);
    expect(isPhoneVerificationPending(null)).toBe(false);
  });

  it("never redirects away from the screen itself, sign-in or onboarding", () => {
    expect(isPhoneVerificationExempt(PHONE_VERIFICATION_PATH)).toBe(true);
    expect(isPhoneVerificationExempt("/app/auth")).toBe(true);
    expect(isPhoneVerificationExempt("/app/auth/callback")).toBe(true);
    // New users verify inline in the onboarding form.
    expect(isPhoneVerificationExempt("/app/onboarding")).toBe(true);
    expect(isPhoneVerificationExempt("/app/units")).toBe(false);
    expect(isPhoneVerificationExempt("/app/authors")).toBe(false);
    expect(isPhoneVerificationExempt("/app/onboardingx")).toBe(false);
  });

  it("does not bounce a gate 403 off onboarding to the standalone screen", () => {
    expect(
      shouldRedirectToPhoneVerification(403, { code: "PHONE_VERIFICATION_REQUIRED" }, "/app/onboarding"),
    ).toBe(false);
  });

  it("redirects on the gate's 403 only", () => {
    const gate = { code: "PHONE_VERIFICATION_REQUIRED" };
    expect(shouldRedirectToPhoneVerification(403, gate, "/app/units")).toBe(true);
    expect(shouldRedirectToPhoneVerification(403, gate, PHONE_VERIFICATION_PATH)).toBe(false);
    expect(shouldRedirectToPhoneVerification(403, { code: "FORBIDDEN" }, "/app/units")).toBe(false);
    expect(shouldRedirectToPhoneVerification(401, gate, "/app/units")).toBe(false);
    expect(shouldRedirectToPhoneVerification(403, null, "/app/units")).toBe(false);
  });
});

describe("a verified number in the profile forms", () => {
  it("is the stored number only once it is verified", () => {
    expect(verifiedPhoneOf({ phone: "+447400883369", phone_verified_at: "2026-10-12T10:00:00Z" })).toBe(
      "+447400883369",
    );
    expect(verifiedPhoneOf({ phone: "+447400883369", phone_verified_at: null })).toBeNull();
    expect(verifiedPhoneOf({ phone: null, phone_verified_at: "2026-10-12T10:00:00Z" })).toBeNull();
    expect(verifiedPhoneOf(null)).toBeNull();
  });

  it("links to re-verification, returning to the form", () => {
    expect(phoneVerificationHref("/app/profile")).toBe(`${PHONE_VERIFICATION_PATH}?return=%2Fapp%2Fprofile`);
    expect(phoneVerificationHref()).toBe(PHONE_VERIFICATION_PATH);
    expect(phoneVerificationHref("https://evil.example")).toBe(PHONE_VERIFICATION_PATH);
  });

  it("only ever returns to an in-app path", () => {
    expect(safeReturnPath("/app/profile")).toBe("/app/profile");
    expect(safeReturnPath("/app/onboarding?step=2")).toBe("/app/onboarding?step=2");
    expect(safeReturnPath("//evil.example/app/")).toBeNull();
    expect(safeReturnPath("https://evil.example")).toBeNull();
    expect(safeReturnPath("/\\evil.example")).toBeNull();
    expect(safeReturnPath("/")).toBeNull();
    expect(safeReturnPath(`${PHONE_VERIFICATION_PATH}?return=x`)).toBeNull();
    expect(safeReturnPath(null)).toBeNull();
  });
});

describe("allowed countries (option B)", () => {
  it("checks the parsed number's country against the list", () => {
    expect(isPhoneCountryAllowed("GB", ALLOWED)).toBe(true);
    expect(isPhoneCountryAllowed("JP", ALLOWED)).toBe(false);
    expect(isPhoneCountryAllowed(null, ALLOWED)).toBe(false);
  });

  it("leaves the decision to the server while the list is not loaded", () => {
    expect(isPhoneCountryAllowed("JP", undefined)).toBe(true);
    expect(isPhoneCountryAllowed("JP", [])).toBe(true);
  });

  it("uses the spec's message, naming the country", () => {
    expect(countryNotAllowedMessage("JP")).toBe(
      "We currently can't verify numbers from Japan. Please use a mobile from a supported country.",
    );
    expect(countryNotAllowedMessage(null)).toContain("from this country");
  });
});

describe("the code field", () => {
  it("keeps digits only, at most six", () => {
    expect(sanitizeOtpInput("12 34-56")).toBe("123456");
    expect(sanitizeOtpInput("1234567")).toBe("123456");
    expect(sanitizeOtpInput("abc")).toBe("");
  });

  it("knows a complete code", () => {
    expect(isCompleteOtp("000000")).toBe(true);
    expect(isCompleteOtp("00000")).toBe(false);
    expect(isCompleteOtp("00000a")).toBe(false);
  });

  it("formats the resend countdown", () => {
    expect(formatCountdown(60)).toBe("1:00");
    expect(formatCountdown(45)).toBe("0:45");
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(-3)).toBe("0:00");
    expect(formatCountdown(4.2)).toBe("0:05");
  });
});

describe("phoneVerificationError", () => {
  it("reads the API's code, message and details", () => {
    expect(
      phoneVerificationError({
        status: 400,
        data: { statusCode: 400, code: "CODE_INVALID", message: "That code is incorrect. 4 attempts left.", attemptsRemaining: 4 },
      }),
    ).toEqual({
      code: "CODE_INVALID",
      message: "That code is incorrect. 4 attempts left.",
      attemptsRemaining: 4,
      retryAfterSeconds: undefined,
    });
    expect(
      phoneVerificationError({ status: 429, data: { code: "RESEND_TOO_SOON", message: "Wait", retryAfterSeconds: 40 } }),
    ).toMatchObject({ code: "RESEND_TOO_SOON", retryAfterSeconds: 40 });
  });

  it("joins a validation error's message list", () => {
    expect(phoneVerificationError({ status: 400, data: { message: ["Enter the 6-digit code from the SMS"] } })).toEqual({
      code: undefined,
      message: "Enter the 6-digit code from the SMS",
      retryAfterSeconds: undefined,
      attemptsRemaining: undefined,
    });
  });

  it("falls back to a generic line for anything else", () => {
    expect(phoneVerificationError({ status: "FETCH_ERROR", error: "TypeError" }).message).toBe(
      "Something went wrong. Please try again.",
    );
    expect(phoneVerificationError(undefined).message).toBe("Something went wrong. Please try again.");
  });
});
