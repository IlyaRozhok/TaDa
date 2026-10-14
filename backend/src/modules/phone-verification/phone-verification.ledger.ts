import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, MoreThanOrEqual, Repository } from "typeorm";

import {
  PhoneVerificationEvent,
  type PhoneVerificationEventType,
} from "@/entities/phone-verification-event.entity";

export interface LedgerEvent {
  type: PhoneVerificationEventType;
  phone: string;
  userId: string | null;
  ip: string | null;
  outcome: string;
}

/**
 * The send/check history the rate limits are counted from. An interface so
 * the service's limits can be tested against an in-memory ledger; production
 * reads `phone_verification_events`.
 */
export abstract class PhoneVerificationLedger {
  abstract record(event: LedgerEvent): Promise<void>;
  /** The latest successful send to `phone` (for `userId`, when given). */
  abstract lastSend(phone: string, userId?: string): Promise<Date | null>;
  /** The earliest successful send matching the filter since `since`, and how many there were. */
  abstract sendsSince(
    filter: { phone?: string; userId?: string; ip?: string },
    since: Date,
  ): Promise<{ count: number; oldest: Date | null }>;
  /** Wrong codes entered for `phone` by `userId` at or after `since`. */
  abstract failedChecksSince(phone: string, userId: string, since: Date): Promise<number>;
}

@Injectable()
export class TypeOrmPhoneVerificationLedger extends PhoneVerificationLedger {
  constructor(
    @InjectRepository(PhoneVerificationEvent)
    private readonly events: Repository<PhoneVerificationEvent>,
  ) {
    super();
  }

  async record(event: LedgerEvent): Promise<void> {
    await this.events.insert({
      type: event.type,
      phone: event.phone,
      user_id: event.userId,
      ip: event.ip,
      outcome: event.outcome,
    });
  }

  async lastSend(phone: string, userId?: string): Promise<Date | null> {
    const latest = await this.events.findOne({
      where: { type: "send", outcome: "sent", phone, ...(userId ? { user_id: userId } : {}) },
      order: { created_at: "DESC" },
      select: ["created_at"],
    });
    return latest?.created_at ?? null;
  }

  async sendsSince(
    filter: { phone?: string; userId?: string; ip?: string },
    since: Date,
  ): Promise<{ count: number; oldest: Date | null }> {
    const where = {
      type: "send" as const,
      outcome: "sent",
      created_at: MoreThan(since),
      ...(filter.phone ? { phone: filter.phone } : {}),
      ...(filter.userId ? { user_id: filter.userId } : {}),
      ...(filter.ip ? { ip: filter.ip } : {}),
    };
    const [rows, count] = await this.events.findAndCount({
      where,
      order: { created_at: "ASC" },
      select: ["created_at"],
      take: 1,
    });
    return { count, oldest: rows[0]?.created_at ?? null };
  }

  async failedChecksSince(phone: string, userId: string, since: Date): Promise<number> {
    // From the send onwards, inclusive: a check stamped in the same instant
    // as its send still spends an attempt.
    return this.events.count({
      where: {
        type: "check",
        outcome: "invalid_code",
        phone,
        user_id: userId,
        created_at: MoreThanOrEqual(since),
      },
    });
  }
}
