import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "@/common/services/email.service";
import { readNotificationsConfig } from "../notifications.config";
import {
  NotificationChannel,
  NotificationMessage,
} from "./notification-channel.interface";

/** The only channel implemented today. */
@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly name = "email";

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Read per call rather than cached: the flag is an incident lever, and a
   * cached copy would need a redeploy to take effect.
   */
  isEnabled(): boolean {
    return readNotificationsConfig(this.configService).emailEnabled;
  }

  resolveRecipient(): string {
    return readNotificationsConfig(this.configService).recipient;
  }

  async send(recipient: string, message: NotificationMessage): Promise<void> {
    await this.emailService.sendEmail({
      to: recipient,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
