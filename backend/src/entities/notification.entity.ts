import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum NotificationStatus {
  Pending = "pending",
  Sent = "sent",
  Failed = "failed",
}

/**
 * One delivery attempt-set for one internal notification.
 *
 * The row exists so a notification survives the container it was born in. The
 * events that produce them fire inside HTTP requests that must not wait for an
 * SMTP round trip, so delivery is detached from the request — and anything
 * detached from a request is lost on the next deploy unless it is written down
 * first. `dedupe_key` is what makes writing it down safe to retry: the same
 * domain event can be emitted twice (a retried OAuth callback, a re-run worker)
 * and still produce exactly one email.
 */
@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** Domain event this notification was built from, e.g. `user_registered`. */
  @Column({ type: "varchar", length: 64 })
  type: string;

  /**
   * Idempotency key. Unique across the table, so a second insert for the same
   * business fact is rejected by Postgres rather than by a read-then-write race.
   */
  @Column({ type: "varchar", length: 255, unique: true })
  dedupe_key: string;

  /** Delivery channel, e.g. `email`. Slack/Telegram join this column later. */
  @Column({ type: "varchar", length: 32 })
  channel: string;

  /**
   * Resolved destination. Always server-configured — never a value that reached
   * us from a request body — so a compromised client cannot aim our sender at
   * an arbitrary inbox.
   */
  @Column({ type: "varchar", length: 320 })
  recipient: string;

  @Column({ type: "varchar", length: 255 })
  subject: string;

  /** Event payload, kept so the body can be rebuilt on a retry. */
  @Column({ type: "jsonb", default: () => "'{}'::jsonb" })
  payload: Record<string, unknown>;

  @Index("idx_notifications_status")
  @Column({
    type: "enum",
    enum: NotificationStatus,
    default: NotificationStatus.Pending,
  })
  status: NotificationStatus;

  @Column({ type: "int", default: 0 })
  attempts: number;

  @Column({ type: "text", nullable: true })
  last_error: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: "timestamp", nullable: true })
  sent_at: Date | null;

  @UpdateDateColumn()
  updated_at: Date;
}
