import { Injectable, Logger } from "@nestjs/common";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare Turnstile, checked before an SMS is sent so a bot cannot spend
 * our SMS budget. Without `TURNSTILE_SECRET_KEY` the check is skipped (logged
 * once), so development and the stub work without Cloudflare; once the key is
 * set every send needs a valid token. A Cloudflare outage fails closed — the
 * check exists to protect paid sends.
 */
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private warnedUnconfigured = false;

  /** Replaced in tests; Cloudflare's endpoint otherwise. */
  fetchImpl: typeof fetch = (input, init) => fetch(input, init);

  get enabled(): boolean {
    return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
  }

  async verify(token: string | undefined, ip: string | null): Promise<boolean> {
    const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
    if (!secret) {
      if (!this.warnedUnconfigured) {
        this.logger.warn("TURNSTILE_SECRET_KEY is not set — the captcha check before sending codes is skipped");
        this.warnedUnconfigured = true;
      }
      return true;
    }
    if (!token) return false;

    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);

    try {
      const response = await this.fetchImpl(SITEVERIFY_URL, {
        method: "POST",
        body,
        signal: AbortSignal.timeout(5000),
      });
      const result = (await response.json()) as { success?: boolean; "error-codes"?: string[] };
      if (!result.success) {
        this.logger.warn(`Turnstile rejected a token (${(result["error-codes"] ?? []).join(", ") || "no reason"})`);
      }
      return result.success === true;
    } catch (error) {
      this.logger.error(`Turnstile verification failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
