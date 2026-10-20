import { EventEmitter2 } from "@nestjs/event-emitter";
import { INestApplication, Logger, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import type { NextFunction, Request, Response } from "express";
// Namespace import: the backend compiles without esModuleInterop.
import * as request from "supertest";

import { User } from "@/entities/user.entity";
import { OTP_PROVIDER } from "./otp/otp-provider";
import { createOtpProvider } from "./otp/otp-provider.factory";
import { PhoneVerificationController } from "./phone-verification.controller";
import { PhoneVerificationLedger } from "./phone-verification.ledger";
import { PhoneVerificationService } from "./phone-verification.service";
import { TurnstileService } from "./turnstile.service";
import { InMemoryPhoneVerificationLedger } from "./testing/in-memory-ledger";

/**
 * The endpoints over HTTP, end to end on the stub provider: the real
 * controller, service, DTO validation (with main.ts's ValidationPipe
 * settings), Turnstile unconfigured — only the database is in memory.
 */
describe("POST /auth/phone/* (stub provider, over HTTP)", () => {
  let app: INestApplication;
  let rows: Map<string, Partial<User>>;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  beforeEach(async () => {
    rows = new Map([["u1", { id: "u1" }]]);
    const users = {
      findOne: jest.fn(async ({ where }: { where: { phone: string } }) =>
        [...rows.values()].find((u) => u.phone === where.phone && u.phone_verified_at) ?? null,
      ),
      update: jest.fn(async (id: string, patch: Partial<User>) => {
        rows.set(id, { ...rows.get(id), ...patch });
      }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [PhoneVerificationController],
      providers: [
        PhoneVerificationService,
        TurnstileService,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: PhoneVerificationLedger, useValue: new InMemoryPhoneVerificationLedger(() => new Date()) },
        // What the module builds outside production with OTP_PROVIDER unset.
        { provide: OTP_PROVIDER, useValue: createOtpProvider({ NODE_ENV: "test" }) },
        // Global in the app (EventEmitterModule.forRoot); the CRM sync listens.
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: Request, _res: Response, next: NextFunction) => {
      // Stands in for the global JWT guard: the signed-in user.
      (req as Request & { user: unknown }).user = { id: "u1" };
      next();
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("verifies a phone end to end with the stub code 000000", async () => {
    const sent = await request(app.getHttpServer())
      .post("/auth/phone/send-code")
      .send({ phone: "07123 456789", country: "GB" })
      .expect(200);
    expect(sent.body).toEqual({ phone: "+447123456789", country: "GB", resendAfterSeconds: 60, expiresInSeconds: 600 });

    const wrong = await request(app.getHttpServer())
      .post("/auth/phone/verify-code")
      .send({ phone: "+447123456789", code: "111111" })
      .expect(400);
    expect(wrong.body).toEqual({
      statusCode: 400,
      code: "CODE_INVALID",
      message: "That code is incorrect. 4 attempts left.",
      attemptsRemaining: 4,
    });

    const verified = await request(app.getHttpServer())
      .post("/auth/phone/verify-code")
      .send({ phone: "+447123456789", code: "000000" })
      .expect(200);
    expect(verified.body).toMatchObject({ verified: true, phone: "+447123456789", phone_country: "GB" });
    expect(rows.get("u1")).toMatchObject({ phone: "+447123456789", phone_country: "GB" });
    expect(rows.get("u1")?.phone_verified_at).toBeInstanceOf(Date);
  });

  it("answers a not-allowed country with its code and message", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/phone/send-code")
      .send({ phone: "+81 90 1234 5678" })
      .expect(400);
    expect(res.body).toMatchObject({
      code: "PHONE_COUNTRY_NOT_ALLOWED",
      message: "We can't verify numbers from this country yet. Please use a supported country.",
    });
  });

  it("enforces the resend wait over HTTP", async () => {
    await request(app.getHttpServer()).post("/auth/phone/send-code").send({ phone: "07123 456789", country: "GB" });
    const res = await request(app.getHttpServer())
      .post("/auth/phone/send-code")
      .send({ phone: "07123 456789", country: "GB" })
      .expect(429);
    expect(res.body).toMatchObject({ code: "RESEND_TOO_SOON" });
  });

  it("rejects a malformed code before it reaches the provider", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/phone/verify-code")
      .send({ phone: "+447123456789", code: "12ab" })
      .expect(400);
    expect(res.body.message).toEqual(["Enter the 6-digit code from the SMS"]);
  });

  it("rejects a lowercase or unknown country shape", async () => {
    await request(app.getHttpServer())
      .post("/auth/phone/send-code")
      .send({ phone: "07123 456789", country: "gb" })
      .expect(400);
  });

  it("serves the config the screen validates with", async () => {
    const res = await request(app.getHttpServer()).get("/auth/phone/config").expect(200);
    expect(res.body).toEqual({
      allowedCountries: ["GB", "GG", "JE", "IM", "IE", "UA", "AT", "FR", "DE", "ES", "IT", "PL", "RO", "PT", "NL", "HK", "IN", "CN", "NG", "ZA", "CA", "US"],
      verificationRequired: false,
    });
  });
});
