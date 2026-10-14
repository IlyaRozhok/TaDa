import type { LedgerEvent } from "../phone-verification.ledger";
import { PhoneVerificationLedger } from "../phone-verification.ledger";

/**
 * A ledger in memory, for the service and endpoint tests. `clock` is shared
 * with the service under test so recorded times follow its moved clock.
 */
export class InMemoryPhoneVerificationLedger extends PhoneVerificationLedger {
  readonly events: Array<LedgerEvent & { at: Date }> = [];

  constructor(private readonly clock: () => Date) {
    super();
  }

  async record(event: LedgerEvent): Promise<void> {
    this.events.push({ ...event, at: this.clock() });
  }

  private sends(filter: { phone?: string; userId?: string; ip?: string }) {
    return this.events.filter(
      (e) =>
        e.type === "send" &&
        e.outcome === "sent" &&
        (!filter.phone || e.phone === filter.phone) &&
        (!filter.userId || e.userId === filter.userId) &&
        (!filter.ip || e.ip === filter.ip),
    );
  }

  async lastSend(phone: string, userId?: string): Promise<Date | null> {
    const matching = this.sends({ phone, userId });
    return matching.length ? matching[matching.length - 1].at : null;
  }

  async sendsSince(filter: { phone?: string; userId?: string; ip?: string }, since: Date) {
    const matching = this.sends(filter).filter((e) => e.at > since);
    return { count: matching.length, oldest: matching[0]?.at ?? null };
  }

  async failedChecksSince(phone: string, userId: string, since: Date): Promise<number> {
    return this.events.filter(
      (e) =>
        e.type === "check" &&
        e.outcome === "invalid_code" &&
        e.phone === phone &&
        e.userId === userId &&
        e.at >= since,
    ).length;
  }
}
