import { Logger } from "@nestjs/common";

import { DisabledOtpProvider } from "./disabled-otp.provider";
import { createOtpProvider } from "./otp-provider.factory";
import { STUB_OTP_CODE, StubOtpProvider, maskPhone } from "./stub-otp.provider";
import { TwilioVerifyOtpProvider, type TwilioVerifyClient } from "./twilio-verify-otp.provider";

const TWILIO_ENV = {
  OTP_PROVIDER: "twilio",
  TWILIO_ACCOUNT_SID: "AC_test",
  TWILIO_AUTH_TOKEN: "token_test",
  TWILIO_VERIFY_SERVICE_SID: "VA_test",
};

/** A Twilio client double recording calls and answering what each test sets. */
function twilioDouble() {
  const send = jest.fn().mockResolvedValue({ status: "pending" });
  const check = jest.fn().mockResolvedValue({ status: "approved" });
  const services = jest.fn(() => ({
    verifications: { create: send },
    verificationChecks: { create: check },
  }));
  const client = { verify: { v2: { services } } } as unknown as TwilioVerifyClient;
  return { client, send, check, services };
}

const twilioError = (code: number) => Object.assign(new Error(`twilio ${code}`), { code });

beforeAll(() => {
  // The factory and providers log loudly on purpose; keep test output clean.
  jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
});

// Hosts as deployed: both run NODE_ENV=production; only prod sets SITE_ENV.
const LOCAL = { NODE_ENV: "development" };
const STAGE = { NODE_ENV: "production" };
const PROD = { NODE_ENV: "production", SITE_ENV: "production" };

describe("createOtpProvider — selection", () => {
  it("runs the stub locally when OTP_PROVIDER is unset, stub or unrecognised", () => {
    expect(createOtpProvider(LOCAL)).toBeInstanceOf(StubOtpProvider);
    expect(createOtpProvider({ NODE_ENV: "test", OTP_PROVIDER: "stub" })).toBeInstanceOf(StubOtpProvider);
    expect(createOtpProvider({ ...LOCAL, OTP_PROVIDER: "sms" })).toBeInstanceOf(StubOtpProvider);
  });

  it.each([
    ["local", LOCAL],
    ["stage", STAGE],
    ["prod", PROD],
  ])("builds Twilio Verify on %s when asked for by name", (_host, env) => {
    expect(createOtpProvider({ ...env, ...TWILIO_ENV }, twilioDouble().client)).toBeInstanceOf(TwilioVerifyOtpProvider);
  });

  it("refuses to start with OTP_PROVIDER=twilio and missing credentials", () => {
    expect(() =>
      createOtpProvider({ OTP_PROVIDER: "twilio", TWILIO_ACCOUNT_SID: "AC_test" }),
    ).toThrow("TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID are not set");
  });
});

describe("createOtpProvider — stage can run the stub (NODE_ENV=production is not the prod signal)", () => {
  it("boots stage in stub mode with OTP_PROVIDER=stub", () => {
    expect(createOtpProvider({ ...STAGE, OTP_PROVIDER: "stub" })).toBeInstanceOf(StubOtpProvider);
  });

  it("lets stage test the gate on the stub", () => {
    expect(
      createOtpProvider({ ...STAGE, OTP_PROVIDER: "stub", PHONE_VERIFICATION_REQUIRED: "true" }),
    ).toBeInstanceOf(StubOtpProvider);
  });

  it("does not choose the stub for a deployed host by default: unset means disabled", () => {
    // Fail-safe: a production host that lost SITE_ENV must not accept 000000.
    expect(createOtpProvider(STAGE)).toBeInstanceOf(DisabledOtpProvider);
    expect(createOtpProvider({ ...STAGE, OTP_PROVIDER: "sms" })).toBeInstanceOf(DisabledOtpProvider);
  });
});

describe("createOtpProvider — the stub never runs with SITE_ENV=production", () => {
  it("refuses to start when the stub is asked for in production", () => {
    expect(() => createOtpProvider({ ...PROD, OTP_PROVIDER: "stub" })).toThrow(
      /never allowed in production; refusing to start/,
    );
    expect(() => createOtpProvider({ ...PROD, SITE_ENV: " Production ", OTP_PROVIDER: "Stub" })).toThrow(
      /refusing to start/,
    );
  });

  it("disables verification in production while no provider is configured", () => {
    const provider = createOtpProvider(PROD);
    expect(provider).toBeInstanceOf(DisabledOtpProvider);
    expect(provider).not.toBeInstanceOf(StubOtpProvider);
  });

  it("keys off SITE_ENV, not NODE_ENV: SITE_ENV=production refuses the stub even without NODE_ENV", () => {
    expect(() => createOtpProvider({ SITE_ENV: "production", OTP_PROVIDER: "stub" })).toThrow(/refusing to start/);
  });

  it("the disabled provider accepts nothing, 000000 included", async () => {
    const provider = createOtpProvider(PROD);
    await expect(provider.sendCode("+447123456789")).resolves.toEqual({ status: "failed", reason: "unavailable" });
    await expect(provider.checkCode("+447123456789", STUB_OTP_CODE)).resolves.toEqual({
      status: "failed",
      reason: "unavailable",
    });
  });
});

describe("createOtpProvider — the gate never starts without a way to verify", () => {
  it.each([
    ["prod", PROD],
    ["stage with no provider", STAGE],
  ])("refuses to start on %s with the gate on", (_host, env) => {
    expect(() => createOtpProvider({ ...env, PHONE_VERIFICATION_REQUIRED: "true" })).toThrow(/lock every user out/);
  });

  it("starts in production with the gate on once Twilio is configured", () => {
    const provider = createOtpProvider(
      { ...PROD, ...TWILIO_ENV, PHONE_VERIFICATION_REQUIRED: "true" },
      twilioDouble().client,
    );
    expect(provider).toBeInstanceOf(TwilioVerifyOtpProvider);
  });
});

describe("StubOtpProvider", () => {
  const stub = new StubOtpProvider();

  it("sends nothing and reports sent", async () => {
    await expect(stub.sendCode("+447123456789")).resolves.toEqual({ status: "sent" });
  });

  it("accepts 000000 for any number and nothing else", async () => {
    await expect(stub.checkCode("+447123456789", "000000")).resolves.toEqual({ status: "approved" });
    await expect(stub.checkCode("+33612345678", "000000")).resolves.toEqual({ status: "approved" });
    await expect(stub.checkCode("+447123456789", "123456")).resolves.toEqual({
      status: "pending",
      reason: "invalid_code",
    });
  });

  it("never logs a code", async () => {
    const warn = jest.spyOn(Logger.prototype, "warn");
    warn.mockClear();
    await stub.sendCode("+447123456789");
    const logged = warn.mock.calls.flat().join(" ");
    expect(logged).not.toContain("000000");
    expect(logged).not.toContain("+447123456789");
  });

  it("masks numbers for logs", () => {
    expect(maskPhone("+447123456789")).toBe("+44*******789");
  });
});

describe("TwilioVerifyOtpProvider", () => {
  const config = { accountSid: "AC_test", authToken: "token_test", serviceSid: "VA_test" };

  it("sends through the configured Verify service by SMS", async () => {
    const { client, send, services } = twilioDouble();
    await expect(new TwilioVerifyOtpProvider(config, client).sendCode("+447123456789")).resolves.toEqual({
      status: "sent",
    });
    expect(services).toHaveBeenCalledWith("VA_test");
    expect(send).toHaveBeenCalledWith({ to: "+447123456789", channel: "sms" });
  });

  it.each([
    [60203, "rate_limited"],
    [60200, "invalid_number"],
    [60205, "invalid_number"],
    [60605, "invalid_number"],
    [60410, "invalid_number"],
    [50000, "provider_error"],
  ])("maps send error %i to %s", async (code, reason) => {
    const { client, send } = twilioDouble();
    send.mockRejectedValueOnce(twilioError(code));
    await expect(new TwilioVerifyOtpProvider(config, client).sendCode("+447123456789")).resolves.toEqual({
      status: "failed",
      reason,
    });
  });

  it.each([
    ["approved", { status: "approved" }],
    ["pending", { status: "pending", reason: "invalid_code" }],
    ["max_attempts_reached", { status: "failed", reason: "too_many_attempts" }],
    ["canceled", { status: "failed", reason: "expired" }],
  ])("maps check status %s", async (status, result) => {
    const { client, check } = twilioDouble();
    check.mockResolvedValueOnce({ status });
    await expect(new TwilioVerifyOtpProvider(config, client).checkCode("+447123456789", "123456")).resolves.toEqual(
      result,
    );
    expect(check).toHaveBeenCalledWith({ to: "+447123456789", code: "123456" });
  });

  it.each([
    [20404, { status: "failed", reason: "expired" }],
    [60202, { status: "failed", reason: "too_many_attempts" }],
    [50000, { status: "failed", reason: "provider_error" }],
  ])("maps check error %i", async (code, result) => {
    const { client, check } = twilioDouble();
    check.mockRejectedValueOnce(twilioError(code));
    await expect(new TwilioVerifyOtpProvider(config, client).checkCode("+447123456789", "123456")).resolves.toEqual(
      result,
    );
  });

  it("never logs the code it checks", async () => {
    const error = jest.spyOn(Logger.prototype, "error");
    error.mockClear();
    const { client, check } = twilioDouble();
    check.mockRejectedValueOnce(twilioError(50000));
    await new TwilioVerifyOtpProvider(config, client).checkCode("+447123456789", "987654");
    expect(error.mock.calls.flat().join(" ")).not.toContain("987654");
  });
});
