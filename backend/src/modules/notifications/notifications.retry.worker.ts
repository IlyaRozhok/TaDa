import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { In, LessThan, Repository } from "typeorm";

import {
  Notification,
  NotificationStatus,
} from "@/entities/notification.entity";
import {
  MAX_DELIVERY_ATTEMPTS,
  RETRY_BATCH_SIZE,
  readNotificationsConfig,
  retryDelayMs,
} from "./notifications.config";
import { NotificationsService } from "./notifications.service";

/**
 * Re-sends notifications that never made it out.
 *
 * This is the half of the design that makes the table worth having: a row that
 * was written but not delivered — because SES was down, or because the
 * container was replaced mid-send — is picked up here on the next tick instead
 * of being lost with the process that created it.
 */
@Injectable()
export class NotificationsRetryWorker {
  private readonly logger = new Logger(NotificationsRetryWorker.name);
  /** Guards against a slow tick overlapping the next one. */
  private running = false;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: "notifications-retry" })
  async retryPending(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const { enabled } = readNotificationsConfig(this.configService);
      if (!enabled) return;

      const due = await this.findDue();
      if (due.length === 0) return;

      this.logger.log(`Retrying ${due.length} undelivered notification(s).`);

      for (const notification of due) {
        await this.notificationsService.deliver(notification);
      }
    } catch (error) {
      // A cron callback that rejects becomes an unhandled rejection; this is
      // the same never-throw rule the handlers follow, for the same reason.
      this.logger.error(
        "Notification retry sweep failed",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.running = false;
    }
  }

  /**
   * Rows still awaiting delivery whose backoff has elapsed.
   *
   * The backoff is measured from `updated_at` rather than a dedicated
   * `next_attempt_at` column — every write in this table touches `updated_at`,
   * so the two would always hold the same information.
   */
  private async findDue(): Promise<Notification[]> {
    const candidates = await this.notificationRepository.find({
      where: {
        status: In([NotificationStatus.Pending, NotificationStatus.Failed]),
        attempts: LessThan(MAX_DELIVERY_ATTEMPTS),
      },
      order: { created_at: "ASC" },
      take: RETRY_BATCH_SIZE,
    });

    const now = Date.now();
    return candidates.filter((notification) => {
      // A pending row with no attempt yet means the process died between the
      // insert and the send. There is nothing to back off from.
      if (notification.attempts === 0) return true;
      const since = now - new Date(notification.updated_at).getTime();
      return since >= retryDelayMs(notification.attempts - 1);
    });
  }
}
