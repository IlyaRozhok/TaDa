import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

import { Notification, NotificationStatus } from "@/entities/notification.entity";
import { NotificationsService } from "./notifications.service";
import { NotificationChannel } from "./channels/notification-channel.interface";
import {
  BookingRequestedEvent,
  TenantCvCompletedEvent,
  UserRegisteredEvent,
} from "./events/notification.events";

/**
 * The insert is expressed as a query builder chain, so the double has to be a
 * chain too. `insertedRows` is what the fake unique index returns: an empty
 * array stands for "ON CONFLICT DO NOTHING swallowed it".
 */
function createRepositoryDouble() {
  const insertedValues: Record<string, any>[] = [];
  let insertedRows: any[] = [];

  const builder = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn((values: Record<string, any>) => {
      insertedValues.push(values);
      return builder;
    }),
    orIgnore: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn(async () => ({ raw: insertedRows })),
  };

  const repository = {
    createQueryBuilder: jest.fn(() => builder),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    find: jest.fn().mockResolvedValue([]),
  };

  return {
    repository,
    insertedValues,
    /** Row the insert hands back; `[]` simulates a dedupe_key collision. */
    setInsertResult(rows: any[]) {
      insertedRows = rows;
    },
  };
}

function createChannelDouble(
  overrides: Partial<NotificationChannel> = {},
): jest.Mocked<NotificationChannel> {
  return {
    name: "email",
    isEnabled: jest.fn().mockReturnValue(true),
    resolveRecipient: jest.fn().mockReturnValue("support@ta-da.co"),
    send: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<NotificationChannel>;
}

function createConfigDouble(values: Record<string, string> = {}): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

const registrationEvent: UserRegisteredEvent = {
  userId: "user-1",
  email: "new@example.com",
  name: "New User",
  role: "tenant",
  createdAt: new Date("2026-08-18T10:00:00.000Z"),
  source: "google_oauth",
};

const cvEvent: TenantCvCompletedEvent = {
  userId: "user-1",
  email: "new@example.com",
  name: "New User",
};

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
    dateTo: null,
    message: null,
    ...overrides,
  };
}

describe("NotificationsService", () => {
  let repo: ReturnType<typeof createRepositoryDouble>;
  let channel: jest.Mocked<NotificationChannel>;
  // Default to UNRESOLVABLE: user-facing copies are only recorded when the
  // service can resolve an account address from the database, so the legacy
  // tests keep seeing exactly the internal ops rows they always asserted on.
  let userRepo: { findOne: jest.Mock };
  let propertyRepo: { findOne: jest.Mock };

  const build = (config: ConfigService = createConfigDouble()) =>
    new NotificationsService(
      repo.repository as any,
      userRepo as any,
      propertyRepo as any,
      [channel],
      config,
    );

  beforeEach(() => {
    userRepo = { findOne: jest.fn().mockResolvedValue(null) };
    propertyRepo = { findOne: jest.fn().mockResolvedValue(null) };
    repo = createRepositoryDouble();
    repo.setInsertResult([
      {
        id: "notification-1",
        type: "user_registered",
        channel: "email",
        recipient: "support@ta-da.co",
        payload: registrationEvent,
        attempts: 0,
        status: NotificationStatus.Pending,
      } as unknown as Notification,
    ]);
    channel = createChannelDouble();

    // The service reports failures through Logger.error by design; silence it
    // so an expected failure path does not look like a broken test run.
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "debug").mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  describe("never throws into the request path", () => {
    it("swallows a channel send failure and records it", async () => {
      channel.send.mockRejectedValue(new Error("SES is down"));

      await expect(
        build().handleUserRegistered(registrationEvent),
      ).resolves.toBeUndefined();

      expect(repo.repository.update).toHaveBeenCalledWith(
        { id: "notification-1" },
        expect.objectContaining({
          status: NotificationStatus.Failed,
          attempts: 1,
          last_error: "SES is down",
        }),
      );
    });

    it("swallows a database failure during insert", async () => {
      repo.repository.createQueryBuilder.mockImplementation(() => {
        throw new Error("connection terminated");
      });

      await expect(
        build().handleUserRegistered(registrationEvent),
      ).resolves.toBeUndefined();
      expect(channel.send).not.toHaveBeenCalled();
    });

    it("swallows a failure while recording a failure", async () => {
      channel.send.mockRejectedValue(new Error("SES is down"));
      repo.repository.update.mockRejectedValue(new Error("db gone too"));

      await expect(
        build().handleUserRegistered(registrationEvent),
      ).resolves.toBeUndefined();
    });

    it("swallows a template failure for an unknown stored type", async () => {
      const service = build();

      await expect(
        service.deliver({
          id: "notification-9",
          type: "not_a_real_type",
          channel: "email",
          recipient: "support@ta-da.co",
          payload: {},
          attempts: 0,
        } as unknown as Notification),
      ).resolves.toBe(false);
      expect(channel.send).not.toHaveBeenCalled();
    });
  });

  describe("dedupe", () => {
    it("sends when the insert produces a row", async () => {
      await build().handleUserRegistered(registrationEvent);

      expect(channel.send).toHaveBeenCalledTimes(1);
      expect(repo.insertedValues[0].dedupe_key).toBe("user_registered:user-1");
    });

    it("does not send when the unique index rejected the insert", async () => {
      repo.setInsertResult([]);

      await build().handleUserRegistered(registrationEvent);

      expect(channel.send).not.toHaveBeenCalled();
    });

    it("keys a completed CV by user, so a repeat event cannot resend", async () => {
      repo.setInsertResult([]);

      await build().handleTenantCvCompleted(cvEvent);

      expect(repo.insertedValues[0].dedupe_key).toBe("cv_completed:user-1");
      expect(channel.send).not.toHaveBeenCalled();
    });

    it("separates a resubmit from the first request by revision", async () => {
      const service = build();

      await service.handleBookingRequested(bookingEvent());
      await service.handleBookingRequested(
        bookingEvent({ isFirstRequest: false, revision: "rev-2" }),
      );

      expect(repo.insertedValues.map((v) => v.dedupe_key)).toEqual([
        "booking_requested:booking-1",
        "booking_requested:booking-1:rev-2",
      ]);
    });
  });

  describe("recipient", () => {
    it("always takes the address from the channel, never from the payload", async () => {
      await build().handleBookingRequested(
        bookingEvent({
          tenant: {
            id: "u",
            name: "Attacker",
            email: "attacker@evil.test",
            phone: null,
          },
        }),
      );

      expect(repo.insertedValues[0].recipient).toBe("support@ta-da.co");
      expect(channel.send).toHaveBeenCalledWith(
        "support@ta-da.co",
        expect.anything(),
      );
      // The payload address must never appear as a recipient anywhere.
      expect(
        repo.insertedValues.map((v) => v.recipient),
      ).not.toContain("attacker@evil.test");
    });

    it("resolves user-facing recipients from the DATABASE, not the payload", async () => {
      userRepo.findOne.mockResolvedValue({
        id: "user-1",
        email: "account@example.com",
      });
      propertyRepo.findOne.mockResolvedValue({
        id: "prop-1",
        operator: { email: "operator@example.com" },
      });

      await build().handleBookingRequested(
        bookingEvent({
          tenant: {
            id: "user-1",
            name: "New User",
            email: "typed-into-form@example.com",
            phone: null,
          },
        }),
      );

      expect(repo.insertedValues.map((v) => v.dedupe_key)).toEqual([
        "booking_requested:booking-1",
        "booking_received_tenant:booking-1",
        "booking_requested_operator:booking-1",
      ]);
      expect(repo.insertedValues.map((v) => v.recipient)).toEqual([
        "support@ta-da.co",
        "account@example.com",
        "operator@example.com",
      ]);
    });

    it("skips the user-facing copies entirely when no account can be resolved", async () => {
      await build().handleBookingRequested(bookingEvent());

      expect(repo.insertedValues).toHaveLength(1);
      expect(repo.insertedValues[0].dedupe_key).toBe(
        "booking_requested:booking-1",
      );
    });

    it("confines an addressed notification to the email channel", async () => {
      channel = createChannelDouble({ name: "slack" } as any);
      userRepo.findOne.mockResolvedValue({
        id: "t",
        email: "account@example.com",
      });

      await build().handleBookingStatusChanged({
        bookingId: "booking-1",
        propertyId: "prop-1",
        tenantId: "t",
        from: "contacting",
        to: "viewing",
        property: { title: "Flat 2B", address: "1 Test Road" },
      });

      expect(repo.insertedValues).toHaveLength(0);
      expect(channel.send).not.toHaveBeenCalled();
    });
  });

  describe("booking lifecycle emails (C1)", () => {
    beforeEach(() => {
      userRepo.findOne.mockResolvedValue({
        id: "t",
        email: "account@example.com",
      });
      propertyRepo.findOne.mockResolvedValue({
        id: "prop-1",
        operator: { email: "operator@example.com" },
      });
    });

    it("keys the status email by (booking, target status)", async () => {
      await build().handleBookingStatusChanged({
        bookingId: "booking-1",
        propertyId: "prop-1",
        tenantId: "t",
        from: "contacting",
        to: "viewing",
        property: { title: "Flat 2B", address: "1 Test Road" },
      });

      expect(repo.insertedValues[0].dedupe_key).toBe(
        "booking_status:booking-1:viewing",
      );
      expect(repo.insertedValues[0].recipient).toBe("account@example.com");
    });

    it("keys the viewing proposal by the slot, so a NEW time emails again", async () => {
      await build().handleViewingProposed({
        bookingId: "booking-1",
        propertyId: "prop-1",
        tenantId: "t",
        proposedAt: "2026-09-05T14:30:00.000Z",
        property: { title: "Flat 2B", address: "1 Test Road" },
      });

      expect(repo.insertedValues[0].dedupe_key).toBe(
        "viewing_proposed:booking-1:2026-09-05T14:30:00.000Z",
      );
    });

    it("notifies the ops inbox and the operator on a confirmation", async () => {
      await build().handleViewingConfirmed({
        bookingId: "booking-1",
        propertyId: "prop-1",
        tenantId: "t",
        proposedAt: "2026-09-05T14:30:00.000Z",
        confirmedAt: "2026-09-01T10:00:00.000Z",
        property: { title: "Flat 2B", address: "1 Test Road" },
      });

      expect(repo.insertedValues.map((v) => v.recipient)).toEqual([
        "support@ta-da.co",
        "operator@example.com",
      ]);
    });
  });

  describe("kill switches", () => {
    it("records nothing when NOTIFICATIONS_ENABLED is false", async () => {
      const config = createConfigDouble({ NOTIFICATIONS_ENABLED: "false" });

      await build(config).handleUserRegistered(registrationEvent);

      expect(repo.repository.createQueryBuilder).not.toHaveBeenCalled();
      expect(channel.send).not.toHaveBeenCalled();
    });

    it("skips a channel that reports itself disabled", async () => {
      channel.isEnabled.mockReturnValue(false);

      await build().handleUserRegistered(registrationEvent);

      expect(repo.repository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it("suppresses a resubmit when NOTIFY_ON_BOOKING_RESUBMIT is false", async () => {
      const config = createConfigDouble({
        NOTIFY_ON_BOOKING_RESUBMIT: "false",
      });

      await build(config).handleBookingRequested(
        bookingEvent({ isFirstRequest: false, revision: "rev-2" }),
      );

      expect(repo.repository.createQueryBuilder).not.toHaveBeenCalled();
      expect(channel.send).not.toHaveBeenCalled();
    });

    it("still sends the first request when the resubmit flag is off", async () => {
      const config = createConfigDouble({
        NOTIFY_ON_BOOKING_RESUBMIT: "false",
      });

      await build(config).handleBookingRequested(bookingEvent());

      expect(channel.send).toHaveBeenCalledTimes(1);
    });

    it("sends resubmits by default, with no flag configured", async () => {
      await build().handleBookingRequested(
        bookingEvent({ isFirstRequest: false, revision: "rev-2" }),
      );

      expect(channel.send).toHaveBeenCalledTimes(1);
    });
  });

  describe("success bookkeeping", () => {
    it("marks the row sent and clears any earlier error", async () => {
      await build().handleUserRegistered(registrationEvent);

      expect(repo.repository.update).toHaveBeenCalledWith(
        { id: "notification-1" },
        expect.objectContaining({
          status: NotificationStatus.Sent,
          attempts: 1,
          last_error: null,
        }),
      );
    });
  });
});
