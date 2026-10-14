import { describe, expect, it } from "vitest";

import {
  PHONE_VERIFICATION_PATH,
  formatCountdown,
  isCompleteOtp,
  isPhoneCountryAllowed,
  isPhoneVerificationExempt,
  isPhoneVerificationPending,
  phoneIssueKey,
  phoneVerificationProblem,
  safeReturnPath,
  sanitizeOtpInput,
  withoutClosingStop,
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

describe("phoneVerificationProblem — server errors map to keys, never to server text", () => {
  const api = (status: number, data: Record<string, unknown>) => ({ status, data });

  it.each([
    [api(429, { code: "RATE_LIMITED", message: "Too many requests. Please try again later." }), "phone.error.rate.limited"],
    // The stock throttler body, without our code: still the rate-limit key.
    [api(429, { statusCode: 429, message: "ThrottlerException: Too Many Requests" }), "phone.error.rate.limited"],
    [api(429, { code: "RESEND_TOO_SOON", retryAfterSeconds: 40 }), "phone.error.rate.limited"],
    [api(429, { code: "TOO_MANY_SENDS", retryAfterSeconds: 3600 }), "phone.error.rate.limited"],
    [api(409, { code: "PHONE_TAKEN" }), "phone.error.already.linked"],
    [api(400, { code: "SEND_FAILED" }), "phone.error.send.failed"],
    [api(503, { code: "VERIFICATION_UNAVAILABLE" }), "phone.error.send.failed"],
    [api(400, { code: "CODE_INVALID", attemptsRemaining: 4 }), "phone.code.error.incorrect"],
    [api(429, { code: "TOO_MANY_ATTEMPTS" }), "phone.code.error.attempts.exceeded"],
    [api(400, { code: "CODE_EXPIRED" }), "phone.code.error.expired"],
    [api(400, { code: "PHONE_INVALID", reason: "EMPTY" }), "phone.error.empty"],
    [api(400, { code: "PHONE_INVALID", reason: "TOO_SHORT" }), "phone.error.too.short"],
    [api(400, { code: "PHONE_INVALID", reason: "TOO_LONG" }), "phone.error.too.long"],
    [api(400, { code: "PHONE_INVALID", reason: "NOT_MOBILE" }), "phone.error.not.mobile"],
    [api(400, { code: "PHONE_INVALID" }), "phone.error.not.mobile"],
    [api(400, { code: "PHONE_COUNTRY_NOT_ALLOWED", country: "JP" }), "phone.error.country.unsupported"],
    [api(400, { code: "CAPTCHA_FAILED" }), "common.error.network"],
    [api(400, { message: ["Enter the 6-digit code from the SMS"] }), "common.error.network"],
    [api(500, { statusCode: 500, message: "Internal server error" }), "common.error.network"],
    [{ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" }, "common.error.network"],
    [undefined, "common.error.network"],
  ])("%j → %s", (error, key) => {
    expect(phoneVerificationProblem(error).key).toBe(key);
  });

  it("treats an unavailable provider as a generic failure when checking a code", () => {
    expect(phoneVerificationProblem(api(503, { code: "VERIFICATION_UNAVAILABLE" }), "verify").key).toBe(
      "common.error.network",
    );
  });

  it("keeps the code and the retry delay for the screen's logic", () => {
    expect(phoneVerificationProblem(api(429, { code: "RESEND_TOO_SOON", retryAfterSeconds: 40 }))).toEqual({
      key: "phone.error.rate.limited",
      code: "RESEND_TOO_SOON",
      retryAfterSeconds: 40,
    });
  });
});

describe("phoneIssueKey — client-side checks map to the same keys", () => {
  it.each([
    ["EMPTY", "phone.error.empty"],
    ["TOO_SHORT", "phone.error.too.short"],
    ["TOO_LONG", "phone.error.too.long"],
    ["NOT_MOBILE", "phone.error.not.mobile"],
    ["INVALID", "phone.error.not.mobile"],
  ] as const)("%s → %s", (issue, key) => {
    expect(phoneIssueKey(issue)).toBe(key);
  });
});

describe("withoutClosingStop", () => {
  it("drops the closing full stop so a colon can follow", () => {
    expect(withoutClosingStop("Enter the 6-digit code we’ve sent to your mobile.")).toBe(
      "Enter the 6-digit code we’ve sent to your mobile",
    );
    expect(withoutClosingStop("请输入我们发送到您手机上的6位验证码。")).toBe("请输入我们发送到您手机上的6位验证码");
    expect(withoutClosingStop("उसे दर्ज करें।")).toBe("उसे दर्ज करें");
  });

  it("leaves text without one alone", () => {
    expect(withoutClosingStop("Enter the code")).toBe("Enter the code");
    expect(withoutClosingStop("v1.2 code")).toBe("v1.2 code");
  });
});
