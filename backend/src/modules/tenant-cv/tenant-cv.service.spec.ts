import { EventEmitter2 } from "@nestjs/event-emitter";

import { TenantCvService } from "./tenant-cv.service";
import { TenantCv } from "@/entities/tenant-cv.entity";
import { NotificationEvents } from "@/modules/notifications/events/notification.events";

/**
 * `markCompleted` is the only write in this service that must happen exactly
 * once: the frontend calls it from a step the user can navigate back to.
 */
describe("TenantCvService.markCompleted", () => {
  let tenantCvRepository: any;
  let userQueryService: any;
  let eventEmitter: EventEmitter2;
  let service: TenantCvService;

  const buildCv = (overrides: Partial<TenantCv> = {}): TenantCv =>
    ({ id: "cv-1", user_id: "user-1", completed_at: null, ...overrides }) as TenantCv;

  beforeEach(() => {
    tenantCvRepository = {
      findOne: jest.fn(),
      // Returns a copy: the service mutates what `create` hands back, and jest
      // records arguments by reference, so returning the same object would make
      // the assertion below see the post-mutation state.
      create: jest.fn((values: any) => ({ ...values })),
      save: jest.fn(async (cv: any) => cv),
    };
    userQueryService = {
      findOneWithProfiles: jest.fn().mockResolvedValue({
        id: "user-1",
        email: "tenant@example.com",
        full_name: "Tenant One",
      }),
    };
    eventEmitter = { emit: jest.fn() } as unknown as EventEmitter2;

    service = new TenantCvService(
      tenantCvRepository,
      userQueryService,
      { refreshAvatarUrl: jest.fn() } as any,
      eventEmitter,
    );
  });

  it("stamps completed_at and emits on the first call", async () => {
    tenantCvRepository.findOne.mockResolvedValue(buildCv());

    const result = await service.markCompleted("user-1");

    expect(result.already_completed).toBe(false);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(tenantCvRepository.save).toHaveBeenCalledTimes(1);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      NotificationEvents.TenantCvCompleted,
      {
        userId: "user-1",
        email: "tenant@example.com",
        name: "Tenant One",
      },
    );
  });

  it("is a no-op on a second call — no write, no event", async () => {
    const alreadyDone = new Date("2026-08-01T09:00:00.000Z");
    tenantCvRepository.findOne.mockResolvedValue(
      buildCv({ completed_at: alreadyDone }),
    );

    const result = await service.markCompleted("user-1");

    expect(result).toEqual({
      completed_at: alreadyDone,
      already_completed: true,
    });
    expect(tenantCvRepository.save).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it("creates the CV row when a tenant somehow has none yet", async () => {
    tenantCvRepository.findOne.mockResolvedValue(null);

    const result = await service.markCompleted("user-1");

    expect(tenantCvRepository.create).toHaveBeenCalledWith({
      user_id: "user-1",
    });
    expect(result.already_completed).toBe(false);
    expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
  });
});

/**
 * C2 — trust badges are admin-set only. The tenant's own update path must not
 * be able to touch them, whatever the payload carries.
 */
describe("TenantCvService — verification badges", () => {
  let tenantCvRepository: any;
  let userQueryService: any;
  let service: TenantCvService;

  beforeEach(() => {
    tenantCvRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: "cv-1",
        user_id: "user-1",
        kyc_status: "not_started",
        referencing_status: "not_started",
      }),
      create: jest.fn((values: any) => ({ ...values })),
      save: jest.fn(async (cv: any) => cv),
    };
    userQueryService = {
      findOneWithProfiles: jest.fn().mockResolvedValue({
        id: "user-1",
        email: "tenant@example.com",
        full_name: "Tenant One",
        created_at: new Date("2026-01-01"),
      }),
    };

    service = new TenantCvService(
      tenantCvRepository,
      userQueryService,
      { refreshAvatarUrl: jest.fn() } as any,
      { emit: jest.fn() } as unknown as EventEmitter2,
    );
  });

  it("ignores kyc/referencing smuggled into the tenant's own update", async () => {
    await service.updateForUser("user-1", {
      about_me: "hello",
      kyc_status: "passed",
      referencing_status: "passed",
    } as any);

    const saved = tenantCvRepository.save.mock.calls[0][0];
    expect(saved.about_me).toBe("hello");
    // The self-certification hole: these MUST keep their stored values.
    expect(saved.kyc_status).toBe("not_started");
    expect(saved.referencing_status).toBe("not_started");
  });

  it("setVerification writes the badges and keeps unspecified ones", async () => {
    await service.setVerification("user-1", { kyc_status: "passed" });

    const saved = tenantCvRepository.save.mock.calls[0][0];
    expect(saved.kyc_status).toBe("passed");
    expect(saved.referencing_status).toBe("not_started");
  });
});
