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

describe("createOtpProvider — selection", () => {
  it("defaults to the stub when OTP_PROVIDER is unset or not twilio", () => {
    expect(createOtpProvider({ NODE_ENV: "development" })).toBeInstanceOf(StubOtpProvider);
    expect(createOtpProvider({ NODE_ENV: "test", OTP_PROVIDER: "stub" })).toBeInstanceOf(StubOtpProvider);
    expect(createOtpProvider({ NODE_ENV: "development", OTP_PROVIDER: "sms" })).toBeInstanceOf(StubOtpProvider);
  });

  it("builds Twilio Verify when asked for by name with full credentials", () => {
    const provider = createOtpProvider({ ...TWILIO_ENV, NODE_ENV: "production" }, twilioDouble().client);
    expect(provider).toBeInstanceOf(TwilioVerifyOtpProvider);
  });

  it("refuses to start with OTP_PROVIDER=twilio and missing credentials", () => {
    expect(() =>
      createOtpProvider({ OTP_PROVIDER: "twilio", TWILIO_ACCOUNT_SID: "AC_test" }),
    ).toThrow("TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID are not set");
  });
});

describe("createOtpProvider — the stub never runs in production", () => {
  it.each([{}, { OTP_PROVIDER: "stub" }, { OTP_PROVIDER: "" }])(
    "production with %j gets the disabled provider, not the stub",
    (env) => {
      const provider = createOtpProvider({ NODE_ENV: "production", ...env });
      expect(provider).toBeInstanceOf(DisabledOtpProvider);
      expect(provider).not.toBeInstanceOf(StubOtpProvider);
    },
  );

  it("the disabled provider accepts nothing, 000000 included", async () => {
    const provider = createOtpProvider({ NODE_ENV: "production" });
    await expect(provider.sendCode("+447123456789")).resolves.toEqual({ status: "failed", reason: "unavailable" });
    await expect(provider.checkCode("+447123456789", STUB_OTP_CODE)).resolves.toEqual({
      status: "failed",
      reason: "unavailable",
    });
  });

  it("refuses to start in production with the gate on and no real provider", () => {
    expect(() =>
      createOtpProvider({ NODE_ENV: "production", PHONE_VERIFICATION_REQUIRED: "true" }),
    ).toThrow(/refusing to start/);
  });

  it("starts in production with the gate on once Twilio is configured", () => {
    const provider = createOtpProvider(
      { ...TWILIO_ENV, NODE_ENV: "production", PHONE_VERIFICATION_REQUIRED: "true" },
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
