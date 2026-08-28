import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

import { Notification, NotificationStatus } from "@/entities/notification.entity";
import {
  NOTIFICATION_CHANNELS,
  NotificationChannel,
} from "./channels/notification-channel.interface";
import {
  MAX_DELIVERY_ATTEMPTS,
  readNotificationsConfig,
} from "./notifications.config";
import {
  BookingRequestedEvent,
  CallRequestedEvent,
  NotificationEvents,
  TenantCvCompletedEvent,
  UserRegisteredEvent,
} from "./events/notification.events";
import { buildMessage, NotificationType } from "./notification.templates";

/**
 * Turns domain events into durable, deduplicated internal notifications.
 *
 * Two invariants hold everywhere in this class:
 *
 * 1. **Nothing throws outward.** Every handler is wrapped. Registration in
 *    particular runs inside a try/catch that redirects the user to an error
 *    page on any exception, so a throw from here would turn a broken mailbox
 *    into a broken sign-in. A dropped notification is an inconvenience; a
 *    dropped login is an outage.
 * 2. **The recipient is never an argument.** It comes from the channel, which
 *    reads it from config. No event payload can redirect an email.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject(NOTIFICATION_CHANNELS)
    private readonly channels: NotificationChannel[],
    private readonly configService: ConfigService,
  ) {}

  @OnEvent(NotificationEvents.UserRegistered, { async: true })
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    await this.record(
      NotificationType.UserRegistered,
      `user_registered:${event.userId}`,
      event as unknown as Record<string, unknown>,
    );
  }

  @OnEvent(NotificationEvents.TenantCvCompleted, { async: true })
  async handleTenantCvCompleted(event: TenantCvCompletedEvent): Promise<void> {
    await this.record(
      NotificationType.TenantCvCompleted,
      `cv_completed:${event.userId}`,
      event as unknown as Record<string, unknown>,
    );
  }

  @OnEvent(NotificationEvents.CallRequested, { async: true })
  async handleCallRequested(event: CallRequestedEvent): Promise<void> {
    // One notification per phone number per UTC day: a double-click on the
    // form is swallowed as a duplicate, while a genuine follow-up the next
    // day still comes through. The date comes from the event, not the row,
    // so replays keep their original key.
    //
    // The number is reduced to its digits because the client sends it masked
    // ("20 7946 0000"), and the same visitor's second submit can carry
    // different spacing. The phone is the key because the form no longer asks
    // for an email — it is the only identity a submission has.
    //
    // Note this dedupes the EMAIL WE SEND, not the submission: every submit is
    // its own row in `call_requests`, so the admin panel still shows both
    // halves of a double-click even when only one notification went out.
    const day = new Date(event.requestedAt).toISOString().slice(0, 10);
    const phoneKey = `${event.phone.countryCode}${event.phone.number.replace(/\D/g, "")}`;
    await this.record(
      NotificationType.CallRequested,
      `call_request:${phoneKey}:${day}`,
      event as unknown as Record<string, unknown>,
    );
  }

  @OnEvent(NotificationEvents.BookingRequested, { async: true })
  async handleBookingRequested(event: BookingRequestedEvent): Promise<void> {
    if (!event.isFirstRequest) {
      const { notifyOnBookingResubmit } = readNotificationsConfig(
        this.configService,
      );
      if (!notifyOnBookingResubmit) {
        this.logger.debug(
          `Skipping resubmit notification for booking ${event.bookingId} — NOTIFY_ON_BOOKING_RESUBMIT is off.`,
        );
        return;
      }
    }

    // A resubmit is a distinct fact from the original request, so it gets its
    // own key. Reusing the first key would make every resubmit look like a
    // duplicate of a notification that was already sent months earlier.
    const dedupeKey = event.isFirstRequest
      ? `booking_requested:${event.bookingId}`
      : `booking_requested:${event.bookingId}:${event.revision}`;

    await this.record(
      NotificationType.BookingRequested,
      dedupeKey,
      event as unknown as Record<string, unknown>,
    );
  }

  /**
   * Persist one row per enabled channel, then try to deliver it immediately.
   * Anything that fails past this point is left for the retry worker.
   */
  private async record(
    type: NotificationType,
    baseDedupeKey: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const { enabled } = readNotificationsConfig(this.configService);
      if (!enabled) {
        this.logger.warn(
          `NOTIFICATIONS_ENABLED is off — dropping ${type} (${baseDedupeKey}).`,
        );
        return;
      }

      const message = buildMessage(type, payload);

      for (const channel of this.channels) {
        if (!channel.isEnabled()) continue;

        const notification = await this.insertIfNew(
          type,
          this.dedupeKeyFor(baseDedupeKey, channel.name),
          channel,
          message.subject,
          payload,
        );

        // Null means the unique index rejected the insert: the same business
        // fact is already recorded, and re-sending it is exactly what dedupe
        // exists to prevent.
        if (!notification) continue;

        await this.deliver(notification);
      }
    } catch (error) {
      this.logger.error(
        `Failed to record notification ${type} (${baseDedupeKey})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Email keeps the bare key the design specifies. Later channels prefix theirs
   * so a Slack copy of an event does not collide with the email copy under the
   * single-column unique index.
   */
  private dedupeKeyFor(baseKey: string, channelName: string): string {
    return channelName === "email" ? baseKey : `${channelName}:${baseKey}`;
  }

  /**
   * `ON CONFLICT DO NOTHING` rather than a read-then-write check: two workers
   * or two replays racing on the same key both reach the insert, and only the
   * database can settle which one wins.
   */
  private async insertIfNew(
    type: NotificationType,
    dedupeKey: string,
    channel: NotificationChannel,
    subject: string,
    payload: Record<string, unknown>,
  ): Promise<Notification | null> {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .insert()
      .into(Notification)
      .values({
        type,
        dedupe_key: dedupeKey,
        channel: channel.name,
        recipient: channel.resolveRecipient(),
        subject,
        payload,
        status: NotificationStatus.Pending,
        attempts: 0,
        // Cast: TypeORM maps the jsonb column's index-signature type through
        // QueryDeepPartialEntity and then no longer sees it as assignable to
        // itself. The shape is exactly the entity's, so the cast asserts what
        // the compiler cannot re-derive.
      } as QueryDeepPartialEntity<Notification>)
      .orIgnore()
      .returning("*")
      .execute();

    const row = result.raw?.[0];
    return row ? (row as Notification) : null;
  }

  /**
   * One delivery attempt. Success and failure are both recorded; neither is
   * re-thrown, because there is no caller left who could do anything with it.
   */
  async deliver(notification: Notification): Promise<boolean> {
    const channel = this.channels.find((c) => c.name === notification.channel);

    if (!channel) {
      await this.markFailed(
        notification,
        `No channel registered for "${notification.channel}"`,
      );
      return false;
    }

    if (!channel.isEnabled()) {
      this.logger.debug(
        `Channel ${channel.name} is disabled — leaving ${notification.id} pending.`,
      );
      return false;
    }

    try {
      const message = buildMessage(
        notification.type as NotificationType,
        notification.payload,
      );
      await channel.send(notification.recipient, message);

      await this.notificationRepository.update(
        { id: notification.id },
        {
          status: NotificationStatus.Sent,
          sent_at: new Date(),
          attempts: notification.attempts + 1,
          last_error: null,
        },
      );
      return true;
    } catch (error) {
      await this.markFailed(
        notification,
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  private async markFailed(
    notification: Notification,
    reason: string,
  ): Promise<void> {
    const attempts = notification.attempts + 1;

    this.logger.error(
      `Notification ${notification.id} (${notification.type}) failed on attempt ${attempts}/${MAX_DELIVERY_ATTEMPTS}: ${reason}`,
    );

    try {
      await this.notificationRepository.update(
        { id: notification.id },
        {
          status: NotificationStatus.Failed,
          attempts,
          // Truncated: a provider stack trace can be long, and the column is
          // read by a human deciding whether to re-enable a channel.
          last_error: reason.slice(0, 2000),
        },
      );
    } catch (updateError) {
      // The database is the thing that just failed, so there is nowhere left to
      // write this. Logging is the whole remedy — and it must not throw either.
      this.logger.error(
        `Could not record failure for notification ${notification.id}`,
        updateError instanceof Error ? updateError.stack : String(updateError),
      );
    }
  }
}
