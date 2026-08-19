import { EventEmitter2 } from "@nestjs/event-emitter";

import { AuthService } from "./auth.service";
import { UserRole, UserStatus } from "@/entities/user.entity";
import { NotificationEvents } from "@/modules/notifications/events/notification.events";

/**
 * Covers only the registration signal. Token issuing and refresh rotation are
 * exercised elsewhere; what matters here is that `user.registered` fires on the
 * branch that created an account and on no other.
 */
describe("AuthService — registration event", () => {
  const googleUser = {
    google_id: "google-123",
    email: "New@Example.com",
    full_name: "New User",
    avatar_url: "https://lh3.googleusercontent.com/a/abc",
    email_verified: true,
  };

  let userRepository: any;
  let tenantProfileRepository: any;
  let tenantCvService: any;
  let eventEmitter: EventEmitter2;
  let service: AuthService;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn((values: any) => ({ ...values })),
      save: jest.fn(async (user: any) => ({
        id: "user-1",
        created_at: new Date("2026-08-18T10:00:00.000Z"),
        ...user,
      })),
      update: jest.fn(),
    };
    tenantProfileRepository = {
      create: jest.fn((values: any) => values),
      save: jest.fn().mockResolvedValue(undefined),
    };
    tenantCvService = {
      ensureShareUuid: jest.fn().mockResolvedValue({ share_uuid: "uuid" }),
    };
    eventEmitter = { emit: jest.fn() } as unknown as EventEmitter2;

    service = new AuthService(
      userRepository,
      tenantProfileRepository,
      {} as any,
      tenantCvService,
      { refreshAvatarUrl: jest.fn() } as any,
      eventEmitter,
    );
  });

  it("emits user.registered when the account is created", async () => {
    userRepository.findOne.mockResolvedValue(null);

    const { isNew } = await service.googleAuth(googleUser);

    expect(isNew).toBe(true);
    expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      NotificationEvents.UserRegistered,
      expect.objectContaining({
        userId: "user-1",
        email: "new@example.com",
        name: "New User",
        role: UserRole.Tenant,
        source: "google_oauth",
      }),
    );
  });

  it("emits nothing when an existing user signs in again", async () => {
    userRepository.findOne.mockResolvedValue({
      id: "user-1",
      email: "new@example.com",
      google_id: "google-123",
      role: UserRole.Tenant,
      status: UserStatus.Active,
      avatar_url: "https://lh3.googleusercontent.com/a/abc",
    });

    const { isNew } = await service.googleAuth(googleUser);

    expect(isNew).toBe(false);
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it("emits nothing when an inactive account is refused", async () => {
    userRepository.findOne.mockResolvedValue({
      id: "user-1",
      status: UserStatus.Suspended,
    });

    await expect(service.googleAuth(googleUser)).rejects.toThrow();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});
