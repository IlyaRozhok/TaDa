import {
  BookingRequestedEvent,
  TenantCvCompletedEvent,
  UserRegisteredEvent,
} from "./events/notification.events";
import { NotificationMessage } from "./channels/notification-channel.interface";

/** Stored in `notifications.type` and used to rebuild a body on retry. */
export enum NotificationType {
  UserRegistered = "user_registered",
  TenantCvCompleted = "cv_completed",
  BookingRequested = "booking_requested",
}

const line = (label: string, value: unknown): string =>
  `${label}: ${value === null || value === undefined || value === "" ? "—" : String(value)}`;

function render(
  type: NotificationType,
  subject: string,
  lines: string[],
): NotificationMessage {
  return { type, subject, text: lines.join("\n") };
}

/**
 * Bodies are plain text on purpose. The audience is the support inbox, the
 * content is a handful of fields, and a text body cannot render an injected
 * `<script>` or break a template the way HTML from user-supplied names can.
 */
export function buildMessage(
  type: NotificationType,
  payload: Record<string, unknown>,
): NotificationMessage {
  switch (type) {
    case NotificationType.UserRegistered: {
      const p = payload as unknown as UserRegisteredEvent;
      return render(type, `New registration — ${p.email}`, [
        "A new user signed up on TaDa.",
        "",
        line("Email", p.email),
        line("Name", p.name),
        line("Role", p.role),
        line("Source", p.source === "admin_created" ? "admin panel" : "Google sign-in"),
        line("Created at", p.createdAt),
        line("User id", p.userId),
      ]);
    }

    case NotificationType.TenantCvCompleted: {
      const p = payload as unknown as TenantCvCompletedEvent;
      return render(type, `Tenant CV completed — ${p.email}`, [
        "A tenant finished onboarding and their CV is now complete.",
        "",
        line("Email", p.email),
        line("Name", p.name),
        line("User id", p.userId),
      ]);
    }

    case NotificationType.BookingRequested: {
      const p = payload as unknown as BookingRequestedEvent;
      const heading = p.isFirstRequest
        ? "New booking request"
        : "Booking request re-submitted";
      return render(
        type,
        `${heading} — ${p.property.title ?? p.property.id}`,
        [
          `${heading} on TaDa.`,
          "",
          line("Property", p.property.title),
          line("Address", p.property.address),
          line("Property id", p.property.id),
          "",
          line("Tenant", p.tenant.name),
          line("Tenant email", p.tenant.email),
          line("Tenant id", p.tenant.id),
          "",
          line("Move-in from", p.dateFrom),
          line("Move-out to", p.dateTo),
          line("Contact email provided", p.emailProvided ? "yes" : "no"),
          line("Phone provided", p.phoneProvided ? "yes" : "no"),
          line("Notes provided", p.descriptionProvided ? "yes" : "no"),
          "",
          "Message:",
          p.message?.trim() || "—",
          "",
          line("Booking id", p.bookingId),
        ],
      );
    }

    default:
      // Reachable only through a stored row whose `type` this build no longer
      // knows — a notification queued before a deploy that removed its type.
      // Throwing hands it to the caller's failure path instead of sending a
      // blank email.
      throw new Error(`No template registered for notification type "${type}"`);
  }
}
