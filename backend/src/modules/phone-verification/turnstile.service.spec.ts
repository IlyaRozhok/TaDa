import { Logger } from "@nestjs/common";

import { TurnstileService } from "./turnstile.service";

const respond = (body: unknown) => jest.fn().mockResolvedValue({ json: async () => body });

describe("TurnstileService", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY;
    jest.restoreAllMocks();
  });

  it("passes everything when no secret is configured, warning once", async () => {
    const service = new TurnstileService();
    service.fetchImpl = jest.fn();

    await expect(service.verify(undefined, null)).resolves.toBe(true);
    await expect(service.verify("anything", "1.2.3.4")).resolves.toBe(true);
    expect(service.enabled).toBe(false);
    expect(service.fetchImpl).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("requires a token once a secret is configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const service = new TurnstileService();
    service.fetchImpl = jest.fn();

    expect(service.enabled).toBe(true);
    await expect(service.verify(undefined, "1.2.3.4")).resolves.toBe(false);
    expect(service.fetchImpl).not.toHaveBeenCalled();
  });

  it("asks Cloudflare and follows its answer", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const service = new TurnstileService();
    service.fetchImpl = respond({ success: true });

    await expect(service.verify("token", "1.2.3.4")).resolves.toBe(true);
    const [url, init] = (service.fetchImpl as jest.Mock).mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      secret: "secret",
      response: "token",
      remoteip: "1.2.3.4",
    });

    service.fetchImpl = respond({ success: false, "error-codes": ["invalid-input-response"] });
    await expect(service.verify("bad", null)).resolves.toBe(false);
  });

  it("fails closed when Cloudflare cannot be reached", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const service = new TurnstileService();
    service.fetchImpl = jest.fn().mockRejectedValue(new Error("timeout"));

    await expect(service.verify("token", null)).resolves.toBe(false);
  });
});
