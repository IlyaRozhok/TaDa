import { HttpException, Logger } from "@nestjs/common";

import { User } from "@/entities/user.entity";
import { DisabledOtpProvider } from "./otp/disabled-otp.provider";
import type { OtpProvider } from "./otp/otp-provider";
import { StubOtpProvider } from "./otp/stub-otp.provider";
import { PHONE_VERIFICATION_LIMITS, PhoneVerificationService } from "./phone-verification.service";
import { TurnstileService } from "./turnstile.service";
import { InMemoryPhoneVerificationLedger } from "./testing/in-memory-ledger";

const UK = "07123 456789";
const UK_E164 = "+447123456789";

/** Users keyed by id, with just enough of a repository for the service. */
function usersDouble(initial: Array<Partial<User>> = []) {
  const rows = new Map(initial.map((u) => [u.id as string, { ...u } as User]));
  const repo = {
    rows,
    findOne: jest.fn(async ({ where }: { where: { phone: string } }) => {
      // The service only asks "who has verified this number?".
      return [...rows.values()].find((u) => u.phone === where.phone && u.phone_verified_at) ?? null;
    }),
    update: jest.fn(async (id: string, patch: Partial<User>) => {
      rows.set(id, { ...rows.get(id), ...patch } as User);
    }),
  };
  return repo;
}

function setup(options: { provider?: OtpProvider; users?: Array<Partial<User>>; captcha?: boolean } = {}) {
  let now = new Date("2026-10-12T10:00:00Z");
  const clock = () => now;
  const ledger = new InMemoryPhoneVerificationLedger(clock);
  const users = usersDouble([{ id: "u1" }, { id: "u2" }, ...(options.users ?? [])]);
  const turnstile = { verify: jest.fn().mockResolvedValue(options.captcha ?? true) } as unknown as TurnstileService;
  const service = new PhoneVerificationService(
    users as any,
    ledger,
    options.provider ?? new StubOtpProvider(),
    turnstile,
  );
  service.now = clock;
  return {
    service,
    ledger,
    users,
    turnstile,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
    user: (id = "u1") => ({ id }) as User,
  };
}

/** The `{ code, ... }` body of the thrown error. */
async function errorOf(promise: Promise<unknown>): Promise<Record<string, unknown> & { status: number }> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof HttpException) {
      return { ...(error.getResponse() as Record<string, unknown>), status: error.getStatus() };
    }
    throw error;
  }
  throw new Error("expected the call to fail");
}

beforeAll(() => {
  jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  delete process.env.ALLOWED_PHONE_COUNTRIES;
});

describe("happy path on the stub", () => {
  it("sends, then verifies with 000000 and marks the user verified", async () => {
    const t = setup();

    await expect(t.service.sendCode(t.user(), { phone: UK, country: "GB" }, "1.2.3.4")).resolves.toEqual({
      phone: UK_E164,
      country: "GB",
      resendAfterSeconds: 60,
      expiresInSeconds: 600,
    });

    const result = await t.service.verifyCode(t.user(), { phone: UK, country: "GB", code: "000000" }, "1.2.3.4");

    expect(result).toEqual({
      verified: true,
      phone: UK_E164,
      phone_country: "GB",
      phone_verified_at: new Date("2026-10-12T10:00:00Z"),
    });
    expect(t.users.rows.get("u1")).toMatchObject({
      phone: UK_E164,
      phone_country: "GB",
      phone_needs_update: false,
      phone_verified_at: new Date("2026-10-12T10:00:00Z"),
    });
  });

  it("accepts the number in any form the input allows", async () => {
    const t = setup();
    await t.service.sendCode(t.user(), { phone: "+44 (0)7123 456789" }, null);
    await expect(
      t.service.verifyCode(t.user(), { phone: "00447123456789", code: "000000" }, null),
    ).resolves.toMatchObject({ phone: UK_E164 });
  });

  it("records outcomes in the ledger, never the code", async () => {
    const t = setup();
    await t.service.sendCode(t.user(), { phone: UK, country: "GB" }, "1.2.3.4");
    await errorOf(t.service.verifyCode(t.user(), { phone: UK, country: "GB", code: "987654" }, "1.2.3.4"));
    await t.service.verifyCode(t.user(), { phone: UK, country: "GB", code: "000000" }, "1.2.3.4");

    expect(t.ledger.events.map((e) => e.outcome)).toEqual(["sent", "invalid_code", "approved"]);
    const stored = JSON.stringify(t.ledger.events);
    expect(stored).not.toContain("000000");
    expect(stored).not.toContain("987654");
  });
});

describe("number checks before anything is sent", () => {
  it.each([
    ["0712345678", "TOO_SHORT", "Number is too short — please check it"],
    ["071234567890", "TOO_LONG", "Number is too long — please check it"],
    ["020 7946 0000", "NOT_MOBILE", "Please enter a mobile number"],
    ["abc", "INVALID", "Please enter a valid phone number"],
    ["   ", "EMPTY", "Please enter a phone number"],
  ])("rejects %s with reason %s", async (phone, reason, message) => {
    const t = setup();
    // `reason` is the stable code the client translates; `message` is for logs.
    expect(await errorOf(t.service.sendCode(t.user(), { phone, country: "GB" }, null))).toMatchObject({
      status: 400,
      code: "PHONE_INVALID",
      reason,
      message,
    });
    expect(t.ledger.events).toHaveLength(0);
  });

  it("blocks a country outside the allowed list before sending", async () => {
    const t = setup();
    const send = jest.spyOn(StubOtpProvider.prototype, "sendCode");
    send.mockClear();

    expect(await errorOf(t.service.sendCode(t.user(), { phone: "090-1234-5678", country: "JP" }, null))).toEqual({
      status: 400,
      statusCode: 400,
      code: "PHONE_COUNTRY_NOT_ALLOWED",
      country: "JP",
      message: "We currently can't verify numbers from Japan. Please use a mobile from a supported country.",
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("judges the country by the number, not the selector", async () => {
    const t = setup();
    // A Japanese number typed internationally with GB selected is still Japanese.
    expect(await errorOf(t.service.sendCode(t.user(), { phone: "+81 90 1234 5678", country: "GB" }, null)))
      .toMatchObject({ code: "PHONE_COUNTRY_NOT_ALLOWED", country: "JP" });
  });

  it("follows ALLOWED_PHONE_COUNTRIES when it is set", async () => {
    process.env.ALLOWED_PHONE_COUNTRIES = "JP";
    const t = setup();
    await expect(t.service.sendCode(t.user(), { phone: "090-1234-5678", country: "JP" }, null)).resolves.toMatchObject({
      phone: "+819012345678",
      country: "JP",
    });
    expect(await errorOf(t.service.sendCode(t.user(), { phone: UK, country: "GB" }, null))).toMatchObject({
      code: "PHONE_COUNTRY_NOT_ALLOWED",
    });
  });

  it("refuses a number another account has verified", async () => {
    const t = setup({ users: [{ id: "owner", phone: UK_E164, phone_verified_at: new Date() }] });
    expect(await errorOf(t.service.sendCode(t.user(), { phone: UK, country: "GB" }, null))).toMatchObject({
      status: 409,
      code: "PHONE_TAKEN",
      message: "This number is already linked to another account.",
    });
  });

  it("lets the owner of a verified number send to it again", async () => {
    const t = setup({ users: [{ id: "owner", phone: UK_E164, phone_verified_at: new Date() }] });
    await expect(t.service.sendCode(t.user("owner"), { phone: UK, country: "GB" }, null)).resolves.toBeDefined();
  });

  it("requires the captcha to pass", async () => {
    const t = setup({ captcha: false });
    expect(await errorOf(t.service.sendCode(t.user(), { phone: UK, country: "GB" }, null))).toMatchObject({
      code: "CAPTCHA_FAILED",
    });
    expect(t.ledger.events).toHaveLength(0);
  });
});

describe("send rate limits", () => {
  const send = (t: ReturnType<typeof setup>, phone = UK, user = "u1", ip: string | null = "1.1.1.1") =>
    t.service.sendCode(t.user(user), { phone, country: "GB" }, ip);

  it("waits 60 seconds between codes to the same number", async () => {
    const t = setup();
    await send(t);
    t.advance(20_000);
    expect(await errorOf(send(t))).toMatchObject({ status: 429, code: "RESEND_TOO_SOON", retryAfterSeconds: 40 });
    t.advance(40_000);
    await expect(send(t)).resolves.toBeDefined();
  });

  it("allows 5 codes an hour to one number", async () => {
    const t = setup();
    for (let i = 0; i < PHONE_VERIFICATION_LIMITS.sendsPerNumberPerHour; i++) {
      await send(t);
      t.advance(61_000);
    }
    expect(await errorOf(send(t))).toMatchObject({ status: 429, code: "TOO_MANY_SENDS" });
    t.advance(60 * 60_000);
    await expect(send(t)).resolves.toBeDefined();
  });

  it("allows 10 codes a day per account, across numbers", async () => {
    const t = setup();
    for (let i = 0; i < 10; i++) {
      await send(t, `07123 45678${i}`, "u1", `10.0.0.${i}`);
    }
    expect(await errorOf(send(t, "07400 883369", "u1", "10.0.0.99"))).toMatchObject({ code: "TOO_MANY_SENDS" });
  });

  it("allows 10 codes a day per IP, across accounts", async () => {
    const t = setup({ users: Array.from({ length: 11 }, (_, i) => ({ id: `ip-user-${i}` })) });
    for (let i = 0; i < 10; i++) {
      await send(t, `07123 45678${i}`, `ip-user-${i}`, "9.9.9.9");
    }
    expect(await errorOf(send(t, "07400 883369", "ip-user-10", "9.9.9.9"))).toMatchObject({
      code: "TOO_MANY_SENDS",
    });
    await expect(send(t, "07400 883369", "ip-user-10", "8.8.8.8")).resolves.toBeDefined();
  });

  it("reports how long until the daily window frees up", async () => {
    const t = setup();
    for (let i = 0; i < 10; i++) {
      await send(t, `07123 45678${i}`);
      t.advance(60 * 60_000);
    }
    // The first send was 10h ago, so a slot frees in 14h.
    expect(await errorOf(send(t, "07400 883369"))).toMatchObject({ retryAfterSeconds: 14 * 3600 });
  });
});

describe("verify", () => {
  async function sent(t: ReturnType<typeof setup>) {
    await t.service.sendCode(t.user(), { phone: UK, country: "GB" }, null);
  }
  const verify = (t: ReturnType<typeof setup>, code: string, user = "u1") =>
    t.service.verifyCode(t.user(user), { phone: UK, country: "GB", code }, null);

  it("needs a code sent to this user first", async () => {
    const t = setup();
    expect(await errorOf(verify(t, "000000"))).toMatchObject({ code: "CODE_EXPIRED" });
  });

  it("expires a code after 10 minutes", async () => {
    const t = setup();
    await sent(t);
    t.advance(10 * 60_000 + 1);
    expect(await errorOf(verify(t, "000000"))).toMatchObject({ status: 400, code: "CODE_EXPIRED" });
  });

  it("counts down 5 attempts per code, then locks it", async () => {
    const t = setup();
    await sent(t);
    for (const remaining of [4, 3, 2, 1]) {
      expect(await errorOf(verify(t, "111111"))).toMatchObject({ code: "CODE_INVALID", attemptsRemaining: remaining });
    }
    expect(await errorOf(verify(t, "111111"))).toMatchObject({ status: 429, code: "TOO_MANY_ATTEMPTS" });
    // Even the right code is refused once the attempts are spent.
    expect(await errorOf(verify(t, "000000"))).toMatchObject({ code: "TOO_MANY_ATTEMPTS" });
    expect(t.users.rows.get("u1")?.phone_verified_at).toBeUndefined();
  });

  it("gives a fresh attempt budget with a new code", async () => {
    const t = setup();
    await sent(t);
    for (let i = 0; i < 5; i++) await errorOf(verify(t, "111111"));
    t.advance(61_000);
    await sent(t);
    await expect(verify(t, "000000")).resolves.toMatchObject({ verified: true });
  });

  it("does not let another account verify a number someone verified meanwhile", async () => {
    const t = setup();
    await sent(t);
    t.users.rows.set("owner", { id: "owner", phone: UK_E164, phone_verified_at: new Date() } as User);
    expect(await errorOf(verify(t, "000000"))).toMatchObject({ code: "PHONE_TAKEN" });
  });

  it("turns a lost race on the unique index into PHONE_TAKEN", async () => {
    const t = setup();
    await sent(t);
    t.users.update.mockRejectedValueOnce(Object.assign(new Error("duplicate"), { driverError: { code: "23505" } }));
    expect(await errorOf(verify(t, "000000"))).toMatchObject({ status: 409, code: "PHONE_TAKEN" });
  });
});

describe("provider failures", () => {
  it("answers 503 when verification is unavailable (production without Twilio)", async () => {
    const t = setup({ provider: new DisabledOtpProvider() });
    expect(await errorOf(t.service.sendCode(t.user(), { phone: UK, country: "GB" }, null))).toMatchObject({
      status: 503,
      code: "VERIFICATION_UNAVAILABLE",
    });
    expect(t.ledger.events.map((e) => e.outcome)).toEqual(["send_failed"]);
  });

  it.each([
    ["invalid_number", "SEND_FAILED"],
    ["rate_limited", "TOO_MANY_SENDS"],
    ["provider_error", "VERIFICATION_UNAVAILABLE"],
  ] as const)("maps a %s send failure to %s", async (reason, code) => {
    const provider: OtpProvider = {
      name: "fake",
      sendCode: jest.fn().mockResolvedValue({ status: "failed", reason }),
      checkCode: jest.fn(),
    };
    const t = setup({ provider });
    expect(await errorOf(t.service.sendCode(t.user(), { phone: UK, country: "GB" }, null))).toMatchObject({ code });
  });

  it.each([
    ["expired", "CODE_EXPIRED"],
    ["too_many_attempts", "TOO_MANY_ATTEMPTS"],
    ["provider_error", "VERIFICATION_UNAVAILABLE"],
  ] as const)("maps a %s check failure to %s", async (reason, code) => {
    const provider: OtpProvider = {
      name: "fake",
      sendCode: jest.fn().mockResolvedValue({ status: "sent" }),
      checkCode: jest.fn().mockResolvedValue({ status: "failed", reason }),
    };
    const t = setup({ provider });
    await t.service.sendCode(t.user(), { phone: UK, country: "GB" }, null);
    expect(
      await errorOf(t.service.verifyCode(t.user(), { phone: UK, country: "GB", code: "123456" }, null)),
    ).toMatchObject({ code });
  });
});

describe("config", () => {
  it("exposes the allowed countries and the gate state", () => {
    const t = setup();
    expect(t.service.config()).toEqual({
      allowedCountries: expect.arrayContaining(["GB", "US", "UA"]),
      verificationRequired: false,
    });
  });
});
