import {
  BookingRequestedEvent,
  BookingStatusChangedEvent,
  CallRequestedEvent,
  TenantCvCompletedEvent,
  UserRegisteredEvent,
  ViewingConfirmedEvent,
  ViewingProposedEvent,
} from "./events/notification.events";
import { NotificationMessage } from "./channels/notification-channel.interface";

/** Stored in `notifications.type` and used to rebuild a body on retry. */
export enum NotificationType {
  UserRegistered = "user_registered",
  TenantCvCompleted = "cv_completed",
  BookingRequested = "booking_requested",
  CallRequested = "call_requested",
  // User-facing transactional emails (package C1). The recipient for these is
  // resolved from the database by NotificationsService, never from payload.
  BookingReceivedTenant = "booking_received_tenant",
  BookingRequestedOperator = "booking_requested_operator",
  BookingStatusChangedTenant = "booking_status_tenant",
  ViewingProposedTenant = "viewing_proposed_tenant",
  ViewingConfirmedOperator = "viewing_confirmed_operator",
  ViewingConfirmedInternal = "viewing_confirmed_internal",
}

/**
 * What each pipeline stage means, in the tenant's language. The status email
 * is useless if it just echoes an internal enum value.
 */
const STATUS_EXPLANATIONS: Record<string, string> = {
  new: "We have received your request and will pick it up shortly.",
  contacting:
    "The operator is reviewing your request and will contact you soon.",
  kyc_referencing:
    "Identity and referencing checks are in progress. You may be asked for documents.",
  approved_viewing:
    "You are approved for a viewing — a date and time will be proposed to you soon.",
  viewing: "Your viewing is being arranged.",
  contract: "The tenancy contract is being prepared for you.",
  deposit: "The next step is the deposit payment.",
  full_payment: "The next step is the remaining payment.",
  move_in: "Your move-in is being arranged.",
  rented: "Your tenancy is complete — welcome to your new home!",
  cancel_booking:
    "Your booking was cancelled. If the property is re-listed you can apply again.",
};

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

    case NotificationType.CallRequested: {
      const p = payload as unknown as CallRequestedEvent;
      return render(type, `Call request (${p.source}) — ${p.name}`, [
        "Someone asked to book a call through the landing form.",
        "",
        line("Reason", p.reasonLabel),
        line("Name", p.name),
        line("Phone", `${p.phone?.countryCode ?? ""} ${p.phone?.number ?? ""}`.trim()),
        line("Preferred time", p.preferredTimes?.length ? p.preferredTimes.join(", ") : null),
        "",
        "Notes:",
        p.notes?.trim() || "—",
        "",
        line("Source", p.source),
        line("Requested at", p.requestedAt),
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
          line("Phone", p.tenant.phone),
          line("Tenant id", p.tenant.id),
          "",
          line("Move-in from", p.dateFrom),
          line("Move-out to", p.dateTo),
          "",
          "Message:",
          p.message?.trim() || "—",
          "",
          line("Booking id", p.bookingId),
        ],
      );
    }

    case NotificationType.BookingReceivedTenant: {
      const p = payload as unknown as BookingRequestedEvent;
      const title = p.property.title ?? "the property";
      return render(type, `We received your request — ${title}`, [
        `Hi${p.tenant.name ? ` ${p.tenant.name}` : ""},`,
        "",
        `We received your ${p.isFirstRequest ? "booking request" : "updated booking request"} for ${title}.`,
        line("Address", p.property.address),
        "",
        "The operator will review it and contact you. You can follow the",
        "status of your request any time in your TaDa account.",
        "",
        "— The TaDa team",
      ]);
    }

    case NotificationType.BookingRequestedOperator: {
      const p = payload as unknown as BookingRequestedEvent;
      const title = p.property.title ?? p.property.id;
      const heading = p.isFirstRequest
        ? "New booking request"
        : "Updated booking request";
      return render(type, `${heading} for your property — ${title}`, [
        `${heading} on TaDa.`,
        "",
        line("Property", p.property.title),
        line("Address", p.property.address),
        "",
        line("Tenant", p.tenant.name),
        line("Contact email", p.tenant.email),
        line("Contact phone", p.tenant.phone),
        line("Move-in from", p.dateFrom),
        line("Move-out to", p.dateTo),
        "",
        "Message:",
        p.message?.trim() || "—",
        "",
        "Please respond promptly — in London, speed of response decides lets.",
        "",
        "— The TaDa team",
      ]);
    }

    case NotificationType.BookingStatusChangedTenant: {
      const p = payload as unknown as BookingStatusChangedEvent;
      const title = p.property.title ?? "your property";
      const explanation =
        STATUS_EXPLANATIONS[p.to] ?? `Your booking status is now "${p.to}".`;
      return render(type, `Booking update — ${title}`, [
        "Hi,",
        "",
        `There is an update on your booking for ${title}.`,
        line("Address", p.property.address),
        "",
        explanation,
        "",
        "You can see the full status in your TaDa account.",
        "",
        "— The TaDa team",
      ]);
    }

    case NotificationType.ViewingProposedTenant: {
      const p = payload as unknown as ViewingProposedEvent;
      const title = p.property.title ?? "the property";
      return render(type, `Viewing proposed — ${title}`, [
        "Hi,",
        "",
        `A viewing has been proposed for ${title}.`,
        line("Address", p.property.address),
        line("Proposed time", p.proposedAt),
        "",
        "Please confirm the time in your TaDa account, or reply if it does",
        "not work for you and we will find another slot.",
        "",
        "— The TaDa team",
      ]);
    }

    case NotificationType.ViewingConfirmedOperator:
    case NotificationType.ViewingConfirmedInternal: {
      const p = payload as unknown as ViewingConfirmedEvent;
      const title = p.property.title ?? p.propertyId;
      return render(type, `Viewing confirmed — ${title}`, [
        "The tenant confirmed the proposed viewing.",
        "",
        line("Property", p.property.title),
        line("Address", p.property.address),
        line("Viewing time", p.proposedAt),
        line("Confirmed at", p.confirmedAt),
        line("Booking id", p.bookingId),
      ]);
    }

    default:
      // Reachable only through a stored row whose `type` this build no longer
      // knows — a notification queued before a deploy that removed its type.
      // Throwing hands it to the caller's failure path instead of sending a
      // blank email.
      throw new Error(`No template registered for notification type "${type}"`);
  }
}
