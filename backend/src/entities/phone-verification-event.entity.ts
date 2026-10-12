import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "./user.entity";

export type PhoneVerificationEventType = "send" | "check";

/**
 * One row per code sent and per code checked — the ledger the SMS rate limits
 * are counted from (60s between sends, 5 sends an hour per number, 10 a day
 * per account or IP, 5 attempts per code). It never holds a code: the
 * provider owns those.
 */
@Entity("phone_verification_events")
@Index("idx_phone_verification_events_phone", ["phone", "created_at"])
@Index("idx_phone_verification_events_user", ["user_id", "created_at"])
@Index("idx_phone_verification_events_ip", ["ip", "created_at"])
export class PhoneVerificationEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 8 })
  type: PhoneVerificationEventType;

  /** E.164. */
  @Column({ type: "varchar", length: 20 })
  phone: string;

  @Column({ type: "uuid", nullable: true })
  user_id: string | null;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "varchar", length: 64, nullable: true })
  ip: string | null;

  /**
   * `sent` | `send_failed` for sends; `approved` | `invalid_code` |
   * `expired` | `too_many_attempts` | `check_failed` for checks.
   */
  @Column({ type: "varchar", length: 24 })
  outcome: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
