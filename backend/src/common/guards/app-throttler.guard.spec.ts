import { Controller, Get, INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { ThrottlerModule } from "@nestjs/throttler";
// Namespace import: the backend compiles without esModuleInterop.
import * as request from "supertest";

import { AppThrottlerGuard, RATE_LIMITED_CODE } from "./app-throttler.guard";

@Controller("ping")
class PingController {
  @Get()
  ping() {
    return { ok: true };
  }
}

/**
 * A throttled request answers with a stable code the client can translate,
 * never the stock "ThrottlerException: Too Many Requests" text.
 */
describe("AppThrottlerGuard", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: "short", ttl: 60_000, limit: 1 }])],
      controllers: [PingController],
      providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("answers 429 with code RATE_LIMITED once the limit is hit", async () => {
    await request(app.getHttpServer()).get("/ping").expect(200);
    const res = await request(app.getHttpServer()).get("/ping").expect(429);

    expect(res.body).toEqual({
      statusCode: 429,
      code: RATE_LIMITED_CODE,
      message: "Too many requests. Please try again later.",
    });
    expect(JSON.stringify(res.body)).not.toContain("ThrottlerException");
  });
});
