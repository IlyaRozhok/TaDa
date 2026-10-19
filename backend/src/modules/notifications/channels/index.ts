import { Provider } from "@nestjs/common";
import { EmailChannel } from "./email.channel";
import { HubspotChannel } from "./hubspot/hubspot.channel";
import { HubspotClient } from "./hubspot/hubspot.client";
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
  // The HubSpot CRM sync: off (records nothing) unless HUBSPOT_ENABLED=true
  // and HUBSPOT_ACCESS_TOKEN is set.
  HubspotClient,
  HubspotChannel,
  {
    provide: NOTIFICATION_CHANNELS,
    useFactory: (email: EmailChannel, hubspot: HubspotChannel) => [email, hubspot],
    inject: [EmailChannel, HubspotChannel],
  },
];

export { EmailChannel, HubspotChannel };
export * from "./notification-channel.interface";
