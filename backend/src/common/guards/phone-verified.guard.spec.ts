import { Controller, Get, INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import type { NextFunction, Request, Response } from "express";
// Namespace import: the backend compiles without esModuleInterop.
import * as request from "supertest";

import { AllowUnverifiedPhone } from "@/common/decorators/allow-unverified-phone.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { PhoneVerifiedGuard } from "./phone-verified.guard";

@Controller("listings")
class GatedController {
  @Get()
  list() {
    return { ok: true };
  }
}

@Controller("auth-like")
@AllowUnverifiedPhone()
class AllowedController {
  @Get()
  me() {
    return { ok: true };
  }
}

@Controller("health-like")
class PublicController {
  @Get()
  @Public()
  health() {
    return { ok: true };
  }
}

/**
 * The gate over HTTP: the guard mounted as a global APP_GUARD, as in
 * AppModule, with a middleware standing in for the JWT guard's user.
 */
describe("PhoneVerifiedGuard", () => {
  let app: INestApplication;
  let currentUser: Record<string, unknown> | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GatedController, AllowedController, PublicController],
      providers: [{ provide: APP_GUARD, useClass: PhoneVerifiedGuard }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as Request & { user?: unknown }).user = currentUser;
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    delete process.env.PHONE_VERIFICATION_REQUIRED;
  });

  const unverified = { id: "u1", phone_verified_at: null };
  const verified = { id: "u2", phone_verified_at: new Date() };

  describe("flag off (the default)", () => {
    it.each([undefined, "false", "1"])("lets an unverified user through with PHONE_VERIFICATION_REQUIRED=%s", async (flag) => {
      if (flag !== undefined) process.env.PHONE_VERIFICATION_REQUIRED = flag;
      currentUser = unverified;
      await request(app.getHttpServer()).get("/listings").expect(200);
    });
  });

  describe("flag on", () => {
    beforeEach(() => {
      process.env.PHONE_VERIFICATION_REQUIRED = "true";
    });

    it("blocks an unverified user with PHONE_VERIFICATION_REQUIRED", async () => {
      currentUser = unverified;
      const res = await request(app.getHttpServer()).get("/listings").expect(403);
      expect(res.body).toEqual({
        statusCode: 403,
        code: "PHONE_VERIFICATION_REQUIRED",
        message: "Please verify your phone number to continue.",
      });
    });

    it("lets a verified user through", async () => {
      currentUser = verified;
      await request(app.getHttpServer()).get("/listings").expect(200);
    });

    it("keeps @AllowUnverifiedPhone routes reachable for the unverified", async () => {
      currentUser = unverified;
      await request(app.getHttpServer()).get("/auth-like").expect(200);
    });

    it("never touches public routes", async () => {
      currentUser = undefined;
      await request(app.getHttpServer()).get("/health-like").expect(200);
    });

    it("leaves a request with no user to the JWT guard", async () => {
      currentUser = undefined;
      await request(app.getHttpServer()).get("/listings").expect(200);
    });
  });
});
