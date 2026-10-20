import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

import { NotificationType } from "@/modules/notifications/notification.templates";
import { HubspotChannel } from "./hubspot.channel";
import { HubspotApiError, HubspotClient } from "./hubspot.client";

function config(values: Record<string, string> = {}): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

const ENABLED = { HUBSPOT_ENABLED: "true", HUBSPOT_ACCESS_TOKEN: "pat-eu1-test", HUBSPOT_PORTAL_ID: "26725201" };

const tenant = {
  id: "user-1",
  email: "jane@example.com",
  first_name: "Jane",
  last_name: "Doe",
  full_name: "Jane Doe",
  phone: "+447123456789",
  nationality: "Canada",
  role: "tenant",
  created_at: new Date("2026-10-19T10:00:00Z"),
};

function clientDouble(overrides: Partial<Record<keyof HubspotClient, jest.Mock>> = {}) {
  return {
    findContact: jest.fn().mockResolvedValue(null),
    createContact: jest.fn().mockResolvedValue({ id: "contact-1", properties: {} }),
    updateContact: jest.fn().mockResolvedValue(undefined),
    propertyExists: jest.fn().mockResolvedValue(true),
    createProperty: jest.fn().mockResolvedValue(undefined),
    getDealPipelines: jest.fn().mockResolvedValue([
      { id: "default", displayOrder: 0, stages: [
        { id: "qualifiedtobuy", displayOrder: 1 },
        { id: "appointmentscheduled", displayOrder: 0 },
      ] },
    ]),
    createDeal: jest.fn().mockResolvedValue("deal-1"),
    ...overrides,
  };
}

/** A request row as the deal-id query builder returns it. */
function requestRepo(row: { id: string; hubspot_deal_id: string | null } | null, extra: Record<string, unknown> = {}) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(row),
  };
  return {
    createQueryBuilder: jest.fn(() => builder),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    findOne: jest.fn().mockResolvedValue(row ? { ...row, ...extra } : null),
  };
}

function build(options: {
  env?: Record<string, string>;
  client?: ReturnType<typeof clientDouble>;
  user?: Record<string, unknown> | null;
  booking?: ReturnType<typeof requestRepo>;
  call?: ReturnType<typeof requestRepo>;
} = {}) {
  const client = options.client ?? clientDouble();
  const booking = options.booking ?? requestRepo({ id: "booking-1", hubspot_deal_id: null });
  const call = options.call ?? requestRepo({ id: "call-1", hubspot_deal_id: null });
  const channel = new HubspotChannel(
    client as unknown as HubspotClient,
    config(options.env ?? ENABLED),
    { findOne: jest.fn().mockResolvedValue(options.user === undefined ? tenant : options.user) } as any,
    { findOne: jest.fn().mockResolvedValue({ id: "cv-1", share_uuid: "share-1" }) } as any,
    { findOne: jest.fn().mockResolvedValue({ id: "prop-1", title: "Flat 2B", price: 2400 }) } as any,
    booking as any,
    call as any,
  );
  return { channel, client, booking, call };
}

const message = (type: NotificationType, payload: Record<string, unknown>) => ({
  type,
  subject: "s",
  text: "t",
  payload,
});

beforeEach(() => {
  jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
});

describe("HubspotChannel switch", () => {
  it("is off by default, and with the flag but no token", () => {
    expect(build({ env: {} }).channel.isEnabled()).toBe(false);
    expect(build({ env: { HUBSPOT_ENABLED: "false", HUBSPOT_ACCESS_TOKEN: "x" } }).channel.isEnabled()).toBe(false);
    expect(build({ env: { HUBSPOT_ENABLED: "true" } }).channel.isEnabled()).toBe(false);
  });

  it("is on with the flag and a token", () => {
    expect(build().channel.isEnabled()).toBe(true);
  });

  it("takes only the synced events", () => {
    const { channel } = build();
    expect(channel.handles(NotificationType.UserRegistered)).toBe(true);
    expect(channel.handles(NotificationType.TenantCvCompleted)).toBe(true);
    expect(channel.handles(NotificationType.CallRequested)).toBe(true);
    expect(channel.handles(NotificationType.BookingRequested)).toBe(true);
    expect(channel.handles(NotificationType.UserContactChanged)).toBe(true);
    expect(channel.handles(NotificationType.BookingStatusChangedTenant)).toBe(false);
    expect(channel.handles(NotificationType.ViewingConfirmedInternal)).toBe(false);
  });
});

describe("HubspotChannel contacts", () => {
  it("creates a tenant on registration as a lead, with the custom properties", async () => {
    const { channel, client } = build();
    await channel.send("hubspot", message(NotificationType.UserRegistered, { userId: "user-1", role: "tenant" }));

    expect(client.findContact).toHaveBeenCalledWith("email", "jane@example.com");
    expect(client.createContact).toHaveBeenCalledWith({
      email: "jane@example.com",
      firstname: "Jane",
      lastname: "Doe",
      phone: "+447123456789",
      tada_nationality: "Canada",
      tada_source: "tenant",
      tada_cv_url: "https://ta-da.co/cv/share-1",
      tada_signup_date: "2026-10-19",
      lifecyclestage: "lead",
    });
  });

  it("does not sync operator or admin registrations", async () => {
    const { channel, client } = build();
    await channel.send("hubspot", message(NotificationType.UserRegistered, { userId: "user-1", role: "operator" }));
    expect(client.findContact).not.toHaveBeenCalled();
  });

  it("advances an existing contact's stage", async () => {
    const client = clientDouble({
      findContact: jest.fn().mockResolvedValue({ id: "contact-9", properties: { lifecyclestage: "lead" } }),
    });
    const { channel } = build({ client });
    await channel.send("hubspot", message(NotificationType.TenantCvCompleted, { userId: "user-1" }));

    expect(client.createContact).not.toHaveBeenCalled();
    expect(client.updateContact).toHaveBeenCalledWith(
      "contact-9",
      expect.objectContaining({ lifecyclestage: "marketingqualifiedlead" }),
    );
  });

  it("never downgrades a contact already further along", async () => {
    const client = clientDouble({
      findContact: jest.fn().mockResolvedValue({ id: "contact-9", properties: { lifecyclestage: "salesqualifiedlead" } }),
    });
    const { channel } = build({ client });
    await channel.send("hubspot", message(NotificationType.TenantCvCompleted, { userId: "user-1" }));

    const [, properties] = client.updateContact.mock.calls[0];
    expect(properties).not.toHaveProperty("lifecyclestage");
    expect(properties.email).toBe("jane@example.com");
  });

  it("updates instead when the contact appears between search and create (409)", async () => {
    const client = clientDouble({
      findContact: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "contact-7", properties: { lifecyclestage: "subscriber" } }),
      createContact: jest.fn().mockRejectedValue(new HubspotApiError(409, "exists", "POST", "/x")),
    });
    const { channel } = build({ client });
    await channel.send("hubspot", message(NotificationType.UserRegistered, { userId: "user-1", role: "tenant" }));

    expect(client.updateContact).toHaveBeenCalledWith("contact-7", expect.objectContaining({ lifecyclestage: "lead" }));
  });

  it("syncs the standard properties only when the key cannot create custom ones", async () => {
    const client = clientDouble({
      propertyExists: jest.fn().mockResolvedValue(false),
      createProperty: jest.fn().mockRejectedValue(new HubspotApiError(403, "scope", "POST", "/x")),
    });
    const { channel } = build({ client });
    await channel.send("hubspot", message(NotificationType.UserRegistered, { userId: "user-1", role: "tenant" }));

    expect(client.createContact).toHaveBeenCalledWith({
      email: "jane@example.com",
      firstname: "Jane",
      lastname: "Doe",
      phone: "+447123456789",
      lifecyclestage: "lead",
    });
    expect(Logger.prototype.warn).toHaveBeenCalledWith(expect.stringContaining("tada_nationality"));
  });

  it("creates the custom properties when they are missing and the key may", async () => {
    const client = clientDouble({ propertyExists: jest.fn().mockResolvedValue(false) });
    const { channel } = build({ client });
    await channel.send("hubspot", message(NotificationType.UserRegistered, { userId: "user-1", role: "tenant" }));

    expect(client.createProperty).toHaveBeenCalledTimes(4);
    expect(client.createProperty).toHaveBeenCalledWith(
      "contacts",
      expect.objectContaining({ name: "tada_signup_date", type: "date", fieldType: "date" }),
    );
  });

  it("lets a HubSpot failure throw, for the retry worker to record", async () => {
    const client = clientDouble({ findContact: jest.fn().mockRejectedValue(new HubspotApiError(500, "down", "POST", "/x")) });
    const { channel } = build({ client });
    await expect(
      channel.send("hubspot", message(NotificationType.UserRegistered, { userId: "user-1", role: "tenant" })),
    ).rejects.toBeInstanceOf(HubspotApiError);
  });
});

describe("HubspotChannel deals", () => {
  const bookingPayload = {
    bookingId: "booking-1",
    property: { id: "prop-1", title: "Flat 2B" },
    tenant: { id: "user-1" },
  };

  it("creates one deal for a booking, in the default pipeline's first stage, and records it", async () => {
    const { channel, client, booking } = build();
    await channel.send("hubspot", message(NotificationType.BookingRequested, bookingPayload));

    expect(client.createContact).toHaveBeenCalledWith(expect.objectContaining({ lifecyclestage: "salesqualifiedlead" }));
    expect(client.createDeal).toHaveBeenCalledWith(
      {
        dealname: "Jane Doe — Booking: Flat 2B",
        amount: "2400",
        tada_cv_url: "https://ta-da.co/cv/share-1",
        tada_property_url: "https://ta-da.co/app/properties/prop-1",
        pipeline: "default",
        dealstage: "appointmentscheduled",
      },
      "contact-1",
    );
    expect(booking.update).toHaveBeenCalledWith(
      { id: "booking-1", hubspot_deal_id: expect.anything() },
      { hubspot_deal_id: "deal-1" },
    );
  });

  it("does not create a second deal for a request that already has one", async () => {
    const booking = requestRepo({ id: "booking-1", hubspot_deal_id: "deal-0" });
    const { channel, client } = build({ booking });
    await channel.send("hubspot", message(NotificationType.BookingRequested, bookingPayload));

    expect(client.createContact).toHaveBeenCalled();
    expect(client.createDeal).not.toHaveBeenCalled();
  });

  it("creates a book-a-call contact by phone when no email was given, and its deal", async () => {
    const call = requestRepo(
      { id: "call-1", hubspot_deal_id: null },
      { name: "Sam Lee", email: null, phone_number: "+447400123456", source: "operator" },
    );
    const { channel, client } = build({ call });
    await channel.send(
      "hubspot",
      message(NotificationType.CallRequested, { callRequestId: "call-1", name: "Sam Lee", email: null, source: "operator" }),
    );

    expect(client.findContact).toHaveBeenCalledWith("phone", "+447400123456");
    expect(client.createContact).toHaveBeenCalledWith({
      firstname: "Sam",
      lastname: "Lee",
      phone: "+447400123456",
      tada_source: "operator",
      lifecyclestage: "salesqualifiedlead",
    });
    expect(client.createDeal).toHaveBeenCalledWith(
      expect.objectContaining({ dealname: "Sam Lee — Book a call" }),
      "contact-1",
    );
  });

  it("does not throw when the deal is created but its id cannot be recorded", async () => {
    const booking = requestRepo({ id: "booking-1", hubspot_deal_id: null });
    booking.update.mockRejectedValue(new Error("db down"));
    const { channel } = build({ booking });
    await expect(
      channel.send("hubspot", message(NotificationType.BookingRequested, bookingPayload)),
    ).resolves.toBeUndefined();
  });
});

describe("HubspotChannel book-a-call answers", () => {
  it("puts the reason in the deal name and all answers in its description", async () => {
    const call = requestRepo(
      { id: "call-1", hubspot_deal_id: null },
      {
        name: "Sam Lee",
        email: "sam@example.com",
        phone_number: null,
        source: "tenant",
        reason: "looking_for_home",
        preferred_time: "Weekday evenings",
        notes: "Needs parking",
      },
    );
    const { channel, client } = build({ call });
    await channel.send(
      "hubspot",
      message(NotificationType.CallRequested, {
        callRequestId: "call-1",
        name: "Sam Lee",
        reasonLabel: "Finding a home",
        source: "tenant",
      }),
    );

    expect(client.createDeal).toHaveBeenCalledWith(
      {
        dealname: "Sam Lee — Book a call: Finding a home",
        description: "Reason: Finding a home\nPreferred time: Weekday evenings\nNotes: Needs parking",
        tada_cv_url: "https://ta-da.co/cv/share-1",
        pipeline: "default",
        dealstage: "appointmentscheduled",
      },
      "contact-1",
    );
  });
});

describe("HubspotChannel contact changes", () => {
  const changed = { userId: "user-1", changed: ["phone"], changedAt: "2026-10-20T09:00:00.000Z" };

  it("refreshes the contact's fields and leaves its stage alone", async () => {
    const client = clientDouble({
      findContact: jest.fn().mockResolvedValue({ id: "contact-9", properties: { lifecyclestage: "lead" } }),
    });
    const { channel } = build({ client });
    await channel.send("hubspot", message(NotificationType.UserContactChanged, changed));

    const [id, properties] = client.updateContact.mock.calls[0];
    expect(id).toBe("contact-9");
    expect(properties).toEqual(expect.objectContaining({ phone: "+447123456789", firstname: "Jane" }));
    expect(properties).not.toHaveProperty("lifecyclestage");
    expect(client.createDeal).not.toHaveBeenCalled();
  });

  it("creates a missing contact without setting a stage", async () => {
    const { channel, client } = build();
    await channel.send("hubspot", message(NotificationType.UserContactChanged, changed));

    expect(client.createContact).toHaveBeenCalledWith(expect.not.objectContaining({ lifecyclestage: expect.anything() }));
  });

  it("does not sync operators", async () => {
    const { channel, client } = build({ user: { ...tenant, role: "operator" } });
    await channel.send("hubspot", message(NotificationType.UserContactChanged, changed));

    expect(client.findContact).not.toHaveBeenCalled();
  });
});

describe("HubspotChannel deal links", () => {
  const bookingPayload = {
    bookingId: "booking-1",
    property: { id: "prop-1", title: "Flat 2B" },
    tenant: { id: "user-1" },
  };

  it("points the links at this host's frontend", async () => {
    const { channel, client } = build({ env: { ...ENABLED, FRONTEND_URL: "https://stage.ta-da.co/" } });
    await channel.send("hubspot", message(NotificationType.BookingRequested, bookingPayload));

    expect(client.createDeal).toHaveBeenCalledWith(
      expect.objectContaining({
        tada_cv_url: "https://stage.ta-da.co/cv/share-1",
        tada_property_url: "https://stage.ta-da.co/app/properties/prop-1",
      }),
      "contact-1",
    );
  });

  it("creates the two deal properties on first run", async () => {
    const client = clientDouble({
      propertyExists: jest.fn(async (objectType: string) => objectType === "contacts"),
    });
    const { channel } = build({ client });
    await channel.send("hubspot", message(NotificationType.BookingRequested, bookingPayload));

    expect(client.createProperty).toHaveBeenCalledWith(
      "deals",
      expect.objectContaining({ name: "tada_cv_url", label: "Tenant CV", fieldType: "text", groupName: "dealinformation" }),
    );
    expect(client.createProperty).toHaveBeenCalledWith(
      "deals",
      expect.objectContaining({ name: "tada_property_url", label: "Property", fieldType: "text" }),
    );
    expect(client.createDeal).toHaveBeenCalledWith(
      expect.objectContaining({ tada_property_url: "https://ta-da.co/app/properties/prop-1" }),
      "contact-1",
    );
  });

  it("still creates the deal, without links, when the deal schema scope is missing", async () => {
    const client = clientDouble({
      propertyExists: jest.fn(async (objectType: string) => {
        if (objectType === "deals") throw new HubspotApiError(403, "scope", "GET", "/x");
        return true;
      }),
    });
    const { channel } = build({ client });
    await channel.send("hubspot", message(NotificationType.BookingRequested, bookingPayload));

    const [properties] = client.createDeal.mock.calls[0];
    expect(properties).not.toHaveProperty("tada_cv_url");
    expect(properties).not.toHaveProperty("tada_property_url");
    expect(properties.dealname).toBe("Jane Doe — Booking: Flat 2B");
    expect(Logger.prototype.warn).toHaveBeenCalledWith(expect.stringContaining("crm.schemas.deals"));
  });

  it("leaves the CV link off a call deal when the email is no TaDa user's", async () => {
    const call = requestRepo(
      { id: "call-1", hubspot_deal_id: null },
      { name: "Sam Lee", email: "sam@example.com", phone_number: null, source: "tenant" },
    );
    const { channel, client } = build({ call, user: null });
    await channel.send("hubspot", message(NotificationType.CallRequested, { callRequestId: "call-1", name: "Sam Lee" }));

    const [properties] = client.createDeal.mock.calls[0];
    expect(properties).not.toHaveProperty("tada_cv_url");
    expect(properties).not.toHaveProperty("tada_property_url");
  });
});
