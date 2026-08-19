import { Provider } from "@nestjs/common";
import { EmailChannel } from "./email.channel";
import { NOTIFICATION_CHANNELS } from "./notification-channel.interface";

/**
 * Registration point for delivery channels.
 *
 * Adding Slack or Telegram is a two-line change here plus one adapter file that
 * implements `NotificationChannel`: nothing in `NotificationsService` or in any
 * event producer has to know a new channel exists. They are deliberately not
 * implemented yet — the interface and this list are the whole preparation.
 */
export const notificationChannelProviders: Provider[] = [
  EmailChannel,
  {
    provide: NOTIFICATION_CHANNELS,
    useFactory: (email: EmailChannel) => [email],
    inject: [EmailChannel],
  },
];

export { EmailChannel };
export * from "./notification-channel.interface";
