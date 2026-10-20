import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";

import { PHONE_ISSUE_MESSAGES, processPhone } from "@/common/phone/phone";
import { User } from "@/entities/user.entity";
import {
  NotificationEvents,
  UserContactChangedEvent,
} from "@/modules/notifications/events/notification.events";
import { OTP_PROVIDER, type OtpProvider } from "./otp/otp-provider";
import { allowedPhoneCountries, phoneVerificationRequired } from "./phone-verification.config";
import { PhoneVerificationErrors as Errors } from "./phone-verification.errors";
import { PhoneVerificationLedger } from "./phone-verification.ledger";
import { TurnstileService } from "./turnstile.service";
import type { SendPhoneCodeDto, VerifyPhoneCodeDto } from "./dto/phone-code.dto";

/** The limits from the spec. Twilio enforces its own on top; these hold for the stub too. */
export const PHONE_VERIFICATION_LIMITS = {
  /** No new code to the same number within a minute of the last one. */
  resendCooldownMs: 60_000,
  /** At most 5 codes an hour to one number. */
  sendsPerNumberPerHour: 5,
  /** At most 10 codes a day per account, and per IP. */
  sendsPerDay: 10,
  /** At most 5 wrong codes per code sent. */
  attemptsPerCode: 5,
  /** How long a sent code can be checked — Twilio Verify's default lifetime. */
  codeTtlMs: 10 * 60_000,
} as const;

const HOUR_MS = 60 * 60_000;
const DAY_MS = 24 * HOUR_MS;

export interface SendCodeResult {
  phone: string;
  country: string;
  resendAfterSeconds: number;
  expiresInSeconds: number;
}

export interface VerifyCodeResult {
  verified: true;
  phone: string;
  phone_country: string;
  phone_verified_at: Date;
}

const isUniqueViolation = (error: unknown): boolean => {
  const err = error as { code?: string; driverError?: { code?: string } } | null;
  return err?.code === "23505" || err?.driverError?.code === "23505";
};

@Injectable()
export class PhoneVerificationService {
  /** Replaced in tests to move time. */
  now: () => Date = () => new Date();

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly ledger: PhoneVerificationLedger,
    @Inject(OTP_PROVIDER) private readonly provider: OtpProvider,
    private readonly turnstile: TurnstileService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** What the verification screen needs to validate before it sends. */
  config() {
    return {
      allowedCountries: allowedPhoneCountries(),
      verificationRequired: phoneVerificationRequired(),
    };
  }

  /**
   * Send flow: normalise (E.164) → valid mobile → allowed country → not
   * another account's → Turnstile → rate limits → provider.
   */
  async sendCode(user: User, dto: SendPhoneCodeDto, ip: string | null): Promise<SendCodeResult> {
    const { e164, country } = this.resolvePhone(dto.phone, dto.country);
    await this.assertNotTaken(e164, user.id);

    if (!(await this.turnstile.verify(dto.turnstileToken, ip))) throw Errors.captchaFailed();

    await this.assertSendAllowed(e164, user.id, ip);

    const result = await this.provider.sendCode(e164, "sms");
    if (result.status !== "sent") {
      await this.ledger.record({ type: "send", phone: e164, userId: user.id, ip, outcome: "send_failed" });
      if (result.reason === "invalid_number") throw Errors.sendFailed();
      if (result.reason === "rate_limited") throw Errors.tooManySends(HOUR_MS / 1000);
      throw Errors.unavailable();
    }

    await this.ledger.record({ type: "send", phone: e164, userId: user.id, ip, outcome: "sent" });
    return {
      phone: e164,
      country,
      resendAfterSeconds: PHONE_VERIFICATION_LIMITS.resendCooldownMs / 1000,
      expiresInSeconds: PHONE_VERIFICATION_LIMITS.codeTtlMs / 1000,
    };
  }

  /**
   * Verify flow: the code must answer this user's latest send to this
   * number, within its lifetime and attempt budget. On approval the number,
   * its country and the verification time are written together.
   */
  async verifyCode(user: User, dto: VerifyPhoneCodeDto, ip: string | null): Promise<VerifyCodeResult> {
    const { e164, country } = this.resolvePhone(dto.phone, dto.country);
    const limits = PHONE_VERIFICATION_LIMITS;

    const sentAt = await this.ledger.lastSend(e164, user.id);
    if (!sentAt || this.now().getTime() - sentAt.getTime() > limits.codeTtlMs) throw Errors.codeExpired();

    const failed = await this.ledger.failedChecksSince(e164, user.id, sentAt);
    if (failed >= limits.attemptsPerCode) throw Errors.tooManyAttempts();

    await this.assertNotTaken(e164, user.id);

    const check = await this.provider.checkCode(e164, dto.code);
    const record = (outcome: string) =>
      this.ledger.record({ type: "check", phone: e164, userId: user.id, ip, outcome });

    if (check.status === "approved") {
      await record("approved");
      const verifiedAt = await this.markVerified(user.id, e164, country);
      // A newly verified number is a contact change for the CRM sync;
      // re-verifying the same number is not. Fire-and-forget.
      if (user.phone !== e164) {
        this.eventEmitter.emit(NotificationEvents.UserContactChanged, {
          userId: user.id,
          changed: ["phone"],
          changedAt: verifiedAt.toISOString(),
        } satisfies UserContactChangedEvent);
      }
      return { verified: true, phone: e164, phone_country: country, phone_verified_at: verifiedAt };
    }

    if (check.status === "pending") {
      await record("invalid_code");
      const remaining = limits.attemptsPerCode - (failed + 1);
      throw remaining > 0 ? Errors.codeInvalid(remaining) : Errors.tooManyAttempts();
    }

    switch (check.reason) {
      case "expired":
        await record("expired");
        throw Errors.codeExpired();
      case "too_many_attempts":
        await record("too_many_attempts");
        throw Errors.tooManyAttempts();
      default:
        await record("check_failed");
        throw Errors.unavailable();
    }
  }

  /** E.164 and the number's own country, or the error the screen shows. */
  private resolvePhone(phone: string, selectedCountry?: string): { e164: string; country: string } {
    const processed = processPhone(phone, selectedCountry);
    if (!processed.e164) {
      const reason = processed.issue ?? "INVALID";
      throw Errors.invalid(
        reason,
        reason === "EMPTY" ? "Please enter a phone number" : PHONE_ISSUE_MESSAGES[reason],
      );
    }
    const country = processed.country ?? selectedCountry ?? "";
    if (!allowedPhoneCountries().includes(country)) throw Errors.countryNotAllowed(country);
    return { e164: processed.e164, country };
  }

  /** One verified number, one account. */
  private async assertNotTaken(e164: string, userId: string): Promise<void> {
    const owner = await this.users.findOne({
      where: { phone: e164, phone_verified_at: Not(IsNull()) },
      select: ["id"],
    });
    if (owner && owner.id !== userId) throw Errors.taken();
  }

  private async assertSendAllowed(e164: string, userId: string, ip: string | null): Promise<void> {
    const limits = PHONE_VERIFICATION_LIMITS;
    const now = this.now().getTime();
    const secondsUntil = (ms: number) => Math.max(1, Math.ceil(ms / 1000));

    const last = await this.ledger.lastSend(e164);
    if (last && now - last.getTime() < limits.resendCooldownMs) {
      throw Errors.resendTooSoon(secondsUntil(limits.resendCooldownMs - (now - last.getTime())));
    }

    const windows: Array<[Parameters<PhoneVerificationLedger["sendsSince"]>[0], number, number]> = [
      [{ phone: e164 }, HOUR_MS, limits.sendsPerNumberPerHour],
      [{ userId }, DAY_MS, limits.sendsPerDay],
      ...(ip ? [[{ ip }, DAY_MS, limits.sendsPerDay] as [{ ip: string }, number, number]] : []),
    ];
    for (const [filter, windowMs, max] of windows) {
      const { count, oldest } = await this.ledger.sendsSince(filter, new Date(now - windowMs));
      if (count >= max) {
        const freesAt = (oldest?.getTime() ?? now) + windowMs;
        throw Errors.tooManySends(secondsUntil(freesAt - now));
      }
    }
  }

  private async markVerified(userId: string, e164: string, country: string): Promise<Date> {
    const verifiedAt = this.now();
    try {
      await this.users.update(userId, {
        phone: e164,
        phone_country: country,
        phone_verified_at: verifiedAt,
        phone_needs_update: false,
      });
    } catch (error) {
      // Another account verified the same number between our check and this
      // write; the partial unique index is the arbiter.
      if (isUniqueViolation(error)) throw Errors.taken();
      throw error;
    }
    return verifiedAt;
  }
}
