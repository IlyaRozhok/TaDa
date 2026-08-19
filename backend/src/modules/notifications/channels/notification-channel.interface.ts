/** DI token for the channel list. Multi-provider, so adapters are additive. */
export const NOTIFICATION_CHANNELS = Symbol("NOTIFICATION_CHANNELS");

/** A message after templating, before it reaches a provider. */
export interface NotificationMessage {
  type: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * A delivery target for internal notifications.
 *
 * `resolveRecipient` returns a server-side constant, not an argument: the whole
 * point of this service is that support@ta-da.co is the only address it can
 * ever reach, so no caller is given the chance to name one.
 */
export interface NotificationChannel {
  /** Stored on the row; also part of the dedupe key for non-email channels. */
  readonly name: string;

  /** False when the channel is switched off or unconfigured; it is then skipped. */
  isEnabled(): boolean;

  resolveRecipient(): string;

  /** Throws on delivery failure so the caller can record it and retry. */
  send(recipient: string, message: NotificationMessage): Promise<void>;
}
