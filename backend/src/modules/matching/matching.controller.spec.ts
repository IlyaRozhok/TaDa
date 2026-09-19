import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { UserRole } from "@/entities/user.entity";
import { MatchingController } from "./matching.controller";
import { MatchingService } from "./matching.service";

/**
 * The admin "view as tenant" lens, at the only layer that decides who may use
 * it. Every route that scores takes the same `asUserId`, so every route is
 * exercised: a gap on one of the three would be a way to read a tenant's
 * scores without being an admin.
 */
describe("MatchingController view-as lens", () => {
  const TENANT = "11111111-1111-4111-8111-111111111111";

  const buildController = () => {
    const service = {
      resolveViewAsTarget: jest.fn(),
      getMatchedPropertiesWithPagination: jest.fn().mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
        avgMatchScore: null,
      }),
      getPropertyMatch: jest.fn().mockResolvedValue({ matchPercentage: 80 }),
      getMatchScores: jest.fn().mockResolvedValue({ scores: {} }),
    };

    const controller = new MatchingController(
      service as unknown as MatchingService,
    );

    return { controller, service };
  };

  const as = (role: UserRole, id = "caller-1") => ({ user: { id, role } });

  // One call per scoring route, so each guard assertion covers all three.
  const routes = {
    feed: (c: MatchingController, req: object, asUserId?: string) =>
      c.getMatchedPropertiesWithPagination(
        req,
        {},
        undefined,
        undefined,
        undefined,
        undefined,
        asUserId,
      ),
    property: (c: MatchingController, req: object, asUserId?: string) =>
      c.getPropertyMatch(req, "prop-1", asUserId),
    scores: (c: MatchingController, req: object, asUserId?: string) =>
      c.getMatchScores(req, { propertyIds: ["prop-1"] }, asUserId),
  };

  describe.each(Object.entries(routes))("%s", (_name, call) => {
    it.each([UserRole.Tenant, UserRole.Operator])(
      "is a 403 for a %s passing asUserId — before any lookup",
      async (role) => {
        const { controller, service } = buildController();

        await expect(
          call(controller, as(role), TENANT),
        ).rejects.toBeInstanceOf(ForbiddenException);
        // No lookup at all: the caller learns nothing about whether the id
        // exists.
        expect(service.resolveViewAsTarget).not.toHaveBeenCalled();
      },
    );

    it("is a 404 when an admin targets a non-tenant", async () => {
      const { controller, service } = buildController();
      service.resolveViewAsTarget.mockRejectedValue(
        new NotFoundException("Tenant not found"),
      );

      await expect(
        call(controller, as(UserRole.Admin), TENANT),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("scores against the caller when no asUserId is given", async () => {
      const { controller, service } = buildController();

      await call(controller, as(UserRole.Tenant, "tenant-self"));

      expect(service.resolveViewAsTarget).not.toHaveBeenCalled();
      const scored = [
        service.getMatchedPropertiesWithPagination,
        service.getPropertyMatch,
        service.getMatchScores,
      ].find((fn) => fn.mock.calls.length > 0)!;
      expect(scored.mock.calls[0]).toContain("tenant-self");
    });
  });

  describe("an admin viewing as a tenant", () => {
    const setup = () => {
      const built = buildController();
      built.service.resolveViewAsTarget.mockResolvedValue({
        id: TENANT,
        full_name: "Ada Lovelace",
      });
      return built;
    };

    it("scores the feed with the tenant's id and names them for the banner", async () => {
      const { controller, service } = setup();

      const result = await routes.feed(
        controller,
        as(UserRole.Admin, "admin-1"),
        TENANT,
      );

      expect(service.resolveViewAsTarget).toHaveBeenCalledWith(TENANT);
      expect(service.getMatchedPropertiesWithPagination.mock.calls[0][0]).toBe(
        TENANT,
      );
      expect(result).toMatchObject({
        viewingAs: { id: TENANT, full_name: "Ada Lovelace" },
      });
    });

    it("scores a property with the tenant's id", async () => {
      const { controller, service } = setup();

      await routes.property(controller, as(UserRole.Admin, "admin-1"), TENANT);

      expect(service.getPropertyMatch).toHaveBeenCalledWith("prop-1", TENANT);
    });

    it("scores a batch with the tenant's id", async () => {
      const { controller, service } = setup();

      await routes.scores(controller, as(UserRole.Admin, "admin-1"), TENANT);

      expect(service.getMatchScores).toHaveBeenCalledWith(["prop-1"], TENANT);
    });
  });

  it("never adds viewingAs to a feed that is not a view-as request", async () => {
    const { controller } = buildController();

    const result = await routes.feed(controller, as(UserRole.Admin, "admin-1"));

    expect(result).not.toHaveProperty("viewingAs");
  });
});
