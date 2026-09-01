import { ConflictException } from "@nestjs/common";

import { UserAdminService } from "./user-admin.service";
import { User } from "@/entities/user.entity";
import { Property, PropertyStatus } from "@/entities/property.entity";
import { Building } from "@/entities/building.entity";
import { BookingRequest, BookingRequestStatus } from "@/entities/booking-request.entity";

/**
 * Covers only the deletion-safety contract (G1). Create/update/role flows are
 * exercised through their own paths; what matters here is that a user row can
 * no longer take live inventory or deal history down with it:
 *
 * - owning properties/buildings refuses deletion (the FKs RESTRICT — this is
 *   the 409 in front of the constraint);
 * - a live tenancy (rented booking) refuses deletion;
 * - a tenant mid-deal is deletable, and the property lifecycle reverts in the
 *   same transaction the cascading booking rows disappear in.
 */
describe("UserAdminService — safe deletion", () => {
  const user = { id: "user-1" } as User;

  let counts: Map<any, number>;
  let em: any;
  let manager: any;
  let service: UserAdminService;

  beforeEach(() => {
    counts = new Map<any, number>([
      [Property, 0],
      [Building, 0],
      [BookingRequest, 0],
    ]);
    em = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue(undefined),
    };
    manager = {
      count: jest.fn(async (entity: any) => counts.get(entity) ?? 0),
      transaction: jest.fn(async (cb: any) => cb(em)),
    };
    const userRepository: any = { manager };

    service = new UserAdminService(
      userRepository,
      {} as any,
      {} as any,
      { emit: jest.fn() } as any,
    );
  });

  it("refuses to delete an account that owns properties or buildings", async () => {
    counts.set(Property, 3);

    await expect(service.removeUserSafely(user)).rejects.toThrow(
      ConflictException,
    );
    expect(manager.transaction).not.toHaveBeenCalled();
  });

  it("refuses to delete an account with a live tenancy", async () => {
    manager.count = jest.fn(async (entity: any, options: any) => {
      if (entity === BookingRequest) {
        expect(options.where.status).toBe(BookingRequestStatus.Rented);
        return 1;
      }
      return 0;
    });

    await expect(service.removeUserSafely(user)).rejects.toThrow(
      ConflictException,
    );
    expect(manager.transaction).not.toHaveBeenCalled();
  });

  it("deletes a plain tenant and touches no property", async () => {
    await service.removeUserSafely(user);

    expect(em.delete).toHaveBeenCalledWith(User, "user-1");
    expect(em.update).not.toHaveBeenCalled();
  });

  it("reverts under_offer -> listed for a deal the deletion abandons", async () => {
    em.find.mockResolvedValue([{ property_id: "prop-1" }]);
    em.count.mockResolvedValue(0); // no other booking still under offer

    await service.removeUserSafely(user);

    expect(em.delete).toHaveBeenCalledWith(User, "user-1");
    expect(em.update).toHaveBeenCalledWith(
      Property,
      { id: "prop-1", status: PropertyStatus.UnderOffer },
      { status: PropertyStatus.Listed },
    );
  });

  it("leaves the property under offer while another tenant's deal survives", async () => {
    em.find.mockResolvedValue([{ property_id: "prop-1" }]);
    em.count.mockResolvedValue(1); // someone else is still at contract+

    await service.removeUserSafely(user);

    expect(em.update).not.toHaveBeenCalled();
  });
});
