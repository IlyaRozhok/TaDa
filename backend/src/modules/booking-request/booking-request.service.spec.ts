import { EventEmitter2 } from "@nestjs/event-emitter";

import { BookingRequestService } from "./booking-request.service";
import { BookingRequestStatus } from "@/entities/booking-request.entity";
import { NotificationEvents } from "@/modules/notifications/events/notification.events";

/**
 * The @Unique(tenant_id, property_id) constraint means a second request for the
 * same property is an update, not an insert. Both paths must announce
 * themselves, and the resubmit must be distinguishable — the config flag that
 * silences resubmits lives in the listener, so the flag it reads is the
 * `isFirstRequest` field emitted here.
 */
describe("BookingRequestService.create — notification event", () => {
  const dto = {
    property_id: "prop-1",
    email: "tenant@example.com",
    phone_number: "+44 7000 000000",
    date_from: "2026-09-01",
    date_to: "2027-09-01",
    description: "Looking forward to a viewing",
  };

  const property = {
    id: "prop-1",
    title: "Flat 2B",
    address: "1 Test Road",
  };

  let bookingRepository: any;
  let propertyRepository: any;
  let eventEmitter: EventEmitter2;
  let service: BookingRequestService;

  beforeEach(() => {
    bookingRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      findOneOrFail: jest.fn(),
      create: jest.fn((values: any) => values),
      save: jest.fn(async (booking: any) => ({ id: "booking-1", ...booking })),
    };
    propertyRepository = { findOne: jest.fn().mockResolvedValue(property) };
    eventEmitter = { emit: jest.fn() } as unknown as EventEmitter2;

    service = new BookingRequestService(
      bookingRepository,
      propertyRepository,
      eventEmitter,
    );
  });

  it("emits with isFirstRequest true on a first create", async () => {
    bookingRepository.findOneOrFail.mockResolvedValue({
      id: "booking-1",
      tenant_id: "user-1",
      email: dto.email,
      phone_number: dto.phone_number,
      description: dto.description,
      date_from: new Date("2026-09-01T00:00:00.000Z"),
      date_to: new Date("2027-09-01T00:00:00.000Z"),
      updated_at: new Date("2026-08-18T10:00:00.000Z"),
      tenant: { id: "user-1", full_name: "Tenant One", email: dto.email },
    });

    await service.create(dto as any, "user-1");

    expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      NotificationEvents.BookingRequested,
      expect.objectContaining({
        bookingId: "booking-1",
        isFirstRequest: true,
        property: { id: "prop-1", title: "Flat 2B", address: "1 Test Road" },
        // The phone travels as a value, not a flag: the support inbox has to
        // be able to call it.
        tenant: {
          id: "user-1",
          name: "Tenant One",
          email: dto.email,
          phone: dto.phone_number,
        },
        dateFrom: "2026-09-01",
        dateTo: "2027-09-01",
        message: dto.description,
      }),
    );
  });

  it("emits with isFirstRequest false when the tenant re-submits", async () => {
    bookingRepository.findOne.mockResolvedValue({
      id: "booking-1",
      tenant_id: "user-1",
      property_id: "prop-1",
      status: BookingRequestStatus.CancelBooking,
      updated_at: new Date("2026-08-10T10:00:00.000Z"),
      tenant: { id: "user-1", full_name: "Tenant One", email: dto.email },
    });

    await service.create(dto as any, "user-1");

    expect(bookingRepository.findOneOrFail).not.toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      NotificationEvents.BookingRequested,
      expect.objectContaining({
        bookingId: "booking-1",
        isFirstRequest: false,
      }),
    );
  });

  it("gives each resubmit its own revision, so none is deduped away", async () => {
    const emitted: any[] = [];
    (eventEmitter.emit as jest.Mock).mockImplementation(
      (_name: string, payload: any) => emitted.push(payload),
    );

    for (const stamp of ["2026-08-10T10:00:00.000Z", "2026-08-11T11:00:00.000Z"]) {
      bookingRepository.findOne.mockResolvedValue({
        id: "booking-1",
        tenant_id: "user-1",
        property_id: "prop-1",
        updated_at: new Date(stamp),
      });
      await service.create(dto as any, "user-1");
    }

    expect(emitted[0].revision).not.toEqual(emitted[1].revision);
  });

  it("emits nothing when validation rejects the request", async () => {
    await expect(
      service.create({ property_id: "prop-1" } as any, "user-1"),
    ).rejects.toThrow("email or phone_number is required");

    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it("emits nothing when the property does not exist", async () => {
    propertyRepository.findOne.mockResolvedValue(null);

    await expect(service.create(dto as any, "user-1")).rejects.toThrow(
      "Property not found",
    );
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});

/**
 * updateStatus enforces a lifecycle over the 11-status pipeline. Before this
 * there was none: any status could move to any other, including rented → new.
 */
describe("BookingRequestService.updateStatus — transition rules", () => {
  let bookingRepository: any;
  let service: BookingRequestService;

  const requestIn = (status: BookingRequestStatus) => ({
    id: "booking-1",
    status,
  });

  beforeEach(() => {
    bookingRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (booking: any) => booking),
      update: jest.fn(async () => ({ affected: 1 })),
    };
    service = new BookingRequestService(
      bookingRepository,
      { findOne: jest.fn() } as any,
      { emit: jest.fn() } as unknown as EventEmitter2,
    );
  });

  const attempt = (from: BookingRequestStatus, to: BookingRequestStatus) => {
    bookingRepository.findOne.mockResolvedValue(requestIn(from));
    return service.updateStatus("booking-1", to);
  };

  it("allows moving forward, including skipped stages", async () => {
    await expect(
      attempt(BookingRequestStatus.New, BookingRequestStatus.ApprovedViewing),
    ).resolves.toMatchObject({ status: BookingRequestStatus.ApprovedViewing });
  });

  it("allows cancelling from any active stage", async () => {
    await expect(
      attempt(BookingRequestStatus.Deposit, BookingRequestStatus.CancelBooking),
    ).resolves.toMatchObject({ status: BookingRequestStatus.CancelBooking });
  });

  it("allows exactly one step back (misclick recovery)", async () => {
    await expect(
      attempt(BookingRequestStatus.Viewing, BookingRequestStatus.ApprovedViewing),
    ).resolves.toMatchObject({ status: BookingRequestStatus.ApprovedViewing });
  });

  it("rejects multi-step resets", async () => {
    await expect(
      attempt(BookingRequestStatus.Contract, BookingRequestStatus.New),
    ).rejects.toThrow(/only one step back/);
    expect(bookingRepository.save).not.toHaveBeenCalled();
  });

  it("treats rented and cancel_booking as terminal", async () => {
    await expect(
      attempt(BookingRequestStatus.Rented, BookingRequestStatus.New),
    ).rejects.toThrow(/terminal/);
    await expect(
      attempt(BookingRequestStatus.CancelBooking, BookingRequestStatus.Contacting),
    ).rejects.toThrow(/terminal/);
  });

  it("is an idempotent no-op on the same status — no save, no error", async () => {
    await expect(
      attempt(BookingRequestStatus.Viewing, BookingRequestStatus.Viewing),
    ).resolves.toMatchObject({ status: BookingRequestStatus.Viewing });
    expect(bookingRepository.save).not.toHaveBeenCalled();
    expect(bookingRepository.update).not.toHaveBeenCalled();
  });

  it("writes with a compare-and-swap on the validated status", async () => {
    await attempt(BookingRequestStatus.New, BookingRequestStatus.Contacting);
    expect(bookingRepository.update).toHaveBeenCalledWith(
      { id: "booking-1", status: BookingRequestStatus.New },
      { status: BookingRequestStatus.Contacting },
    );
  });

  it("returns 409 when the status changed concurrently instead of overwriting it", async () => {
    bookingRepository.update.mockResolvedValue({ affected: 0 });
    await expect(
      attempt(BookingRequestStatus.New, BookingRequestStatus.Contacting),
    ).rejects.toThrow(/changed by someone else/);
  });
});

/**
 * The resubmit branch of create() writes `status` too, so the lifecycle must
 * hold there as well — it used to reset ANY booking (including rented) to new.
 */
describe("BookingRequestService.create — resubmit lifecycle", () => {
  const dto = {
    property_id: "prop-1",
    email: "tenant@example.com",
    phone_number: "+44 7000 000000",
    date_from: "2026-09-01",
    date_to: "2027-09-01",
    description: "Updated message",
  };
  const property = { id: "prop-1", title: "Flat 2B", address: "1 Test Road" };

  let bookingRepository: any;
  let service: BookingRequestService;

  const withExisting = (status: BookingRequestStatus) => {
    bookingRepository.findOne.mockResolvedValue({
      id: "booking-1",
      property_id: "prop-1",
      tenant_id: "tenant-1",
      status,
    });
  };

  beforeEach(() => {
    bookingRepository = {
      findOne: jest.fn(),
      create: jest.fn((values: any) => values),
      save: jest.fn(async (booking: any) => booking),
    };
    service = new BookingRequestService(
      bookingRepository,
      { findOne: jest.fn().mockResolvedValue(property) } as any,
      { emit: jest.fn() } as unknown as EventEmitter2,
    );
  });

  it("keeps the current stage on an active booking instead of resetting to new", async () => {
    withExisting(BookingRequestStatus.Contract);
    const result = await service.create(dto as any, "tenant-1");
    expect(result.status).toBe(BookingRequestStatus.Contract);
    expect(result.description).toBe("Updated message");
  });

  it("reopens a cancelled booking at the start of the pipeline", async () => {
    withExisting(BookingRequestStatus.CancelBooking);
    const result = await service.create(dto as any, "tenant-1");
    expect(result.status).toBe(BookingRequestStatus.New);
  });

  it("refuses to reopen a rented booking", async () => {
    withExisting(BookingRequestStatus.Rented);
    await expect(service.create(dto as any, "tenant-1")).rejects.toThrow(
      /already rented/,
    );
    expect(bookingRepository.save).not.toHaveBeenCalled();
  });
});
