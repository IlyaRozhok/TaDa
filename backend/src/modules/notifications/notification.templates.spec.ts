import { buildMessage, NotificationType } from "./notification.templates";
import {
  BookingRequestedEvent,
  TenantCvCompletedEvent,
  UserRegisteredEvent,
} from "./events/notification.events";

/**
 * These bodies go to one fixed internal address (support@), so the bar is
 * "can the team act on this without opening the admin panel". That rules out
 * `provided: yes` flags standing in for values the payload already carries,
 * and it rules out repeating a block the reader has already scrolled past.
 */
function bookingEvent(
  overrides: Partial<BookingRequestedEvent> = {},
): BookingRequestedEvent {
  return {
    bookingId: "booking-1",
    isFirstRequest: true,
    revision: "2026-08-18T10:00:00.000Z",
    property: { id: "prop-1", title: "Flat 2B", address: "1 Test Road" },
    tenant: {
      id: "user-1",
      name: "New User",
      email: "new@example.com",
      phone: "+44 7700 900123",
    },
    dateFrom: "2026-09-01",
    dateTo: "2026-12-01",
    message: "Can I view it on Saturday?",
    ...overrides,
  };
}

const build = (
  type: NotificationType,
  payload: Record<string, unknown>,
): string =>
  buildMessage(type, payload).text;

/** How many lines of the body open with `label:`. */
const labelCount = (body: string, label: string): number =>
  body.split("\n").filter((l) => l.startsWith(`${label}:`)).length;

describe("buildMessage", () => {
  describe("booking requested", () => {
    const render = (overrides: Partial<BookingRequestedEvent> = {}) =>
      build(
        NotificationType.BookingRequested,
        bookingEvent(overrides) as unknown as Record<string, unknown>,
      );

    it("shows the real phone number instead of a provided flag", () => {
      expect(render()).toContain("Phone: +44 7700 900123");
    });

    it("falls back to a dash when the form carried no phone", () => {
      expect(render({ tenant: { ...bookingEvent().tenant, phone: null } })).toContain(
        "Phone: —",
      );
    });

    it("carries no boolean 'provided' lines at all", () => {
      expect(render()).not.toMatch(/provided/i);
    });

    it("prints every field block exactly once", () => {
      const body = render();

      for (const label of [
        "Property",
        "Address",
        "Property id",
        "Tenant",
        "Tenant email",
        "Phone",
        "Tenant id",
        "Move-in from",
        "Move-out to",
        "Booking id",
      ]) {
        expect(labelCount(body, label)).toBe(1);
      }
      expect(body.split("\n").filter((l) => l === "Message:")).toHaveLength(1);
    });

    it("keeps the fields support needs to act on", () => {
      const body = render();

      expect(body).toContain("Property: Flat 2B");
      expect(body).toContain("Address: 1 Test Road");
      expect(body).toContain("Property id: prop-1");
      expect(body).toContain("Tenant: New User");
      expect(body).toContain("Tenant email: new@example.com");
      expect(body).toContain("Tenant id: user-1");
      expect(body).toContain("Move-in from: 2026-09-01");
      expect(body).toContain("Move-out to: 2026-12-01");
      expect(body).toContain("Can I view it on Saturday?");
      expect(body).toContain("Booking id: booking-1");
    });

    it("renders an empty message as a dash rather than a blank tail", () => {
      expect(render({ message: "   " })).toContain("Message:\n—");
    });

    it("marks a resubmit in the subject", () => {
      const message = buildMessage(
        NotificationType.BookingRequested,
        bookingEvent({ isFirstRequest: false }) as unknown as Record<
          string,
          unknown
        >,
      );

      expect(message.subject).toBe("Booking request re-submitted — Flat 2B");
    });
  });

  describe("user registered", () => {
    const event: UserRegisteredEvent = {
      userId: "user-1",
      email: "new@example.com",
      name: "New User",
      role: "tenant",
      createdAt: new Date("2026-08-18T10:00:00.000Z"),
      source: "google_oauth",
    };

    it("shows the account values and no provided flags", () => {
      const body = build(
        NotificationType.UserRegistered,
        event as unknown as Record<string, unknown>,
      );

      expect(body).toContain("Email: new@example.com");
      expect(body).toContain("Name: New User");
      expect(body).toContain("Role: tenant");
      expect(body).toContain("Source: Google sign-in");
      expect(body).toContain("User id: user-1");
      expect(body).not.toMatch(/provided/i);
      expect(labelCount(body, "Email")).toBe(1);
    });
  });

  describe("tenant CV completed", () => {
    const event: TenantCvCompletedEvent = {
      userId: "user-1",
      email: "new@example.com",
      name: "New User",
    };

    it("shows the account values and no provided flags", () => {
      const body = build(
        NotificationType.TenantCvCompleted,
        event as unknown as Record<string, unknown>,
      );

      expect(body).toContain("Email: new@example.com");
      expect(body).toContain("Name: New User");
      expect(body).toContain("User id: user-1");
      expect(body).not.toMatch(/provided/i);
      expect(labelCount(body, "Name")).toBe(1);
    });
  });

  it("throws for a stored type this build no longer knows", () => {
    expect(() =>
      buildMessage("not_a_real_type" as NotificationType, {}),
    ).toThrow(/No template registered/);
  });
});
