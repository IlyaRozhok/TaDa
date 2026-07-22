import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserProfileService } from "./user-profile.service";
import { User } from "../../../entities/user.entity";
import { TenantProfile } from "../../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../../entities/operator-profile.entity";
import { Preferences } from "../../../entities/preferences.entity";

/**
 * Characterization tests for UserProfileService.
 *
 * These pin the CURRENT (pre-consolidation) write behaviour, where personal /
 * contact fields are stored on the *profile* tables rather than on `users`.
 * The Users/Profiles schema consolidation will flip this so `users` is the
 * single source of truth — at which point these expectations change
 * deliberately, and this file documents exactly what the old behaviour was.
 */
describe("UserProfileService (characterization)", () => {
  let service: UserProfileService;
  let tenantRepo: { save: jest.Mock; create: jest.Mock; remove: jest.Mock };
  let operatorRepo: { save: jest.Mock; create: jest.Mock; remove: jest.Mock };
  let preferencesRepo: { save: jest.Mock; create: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    const repoMock = () => ({
      save: jest.fn((entity) => Promise.resolve(entity)),
      create: jest.fn((entity) => entity),
      remove: jest.fn(() => Promise.resolve()),
    });
    tenantRepo = repoMock();
    operatorRepo = repoMock();
    preferencesRepo = repoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        { provide: getRepositoryToken(TenantProfile), useValue: tenantRepo },
        { provide: getRepositoryToken(OperatorProfile), useValue: operatorRepo },
        { provide: getRepositoryToken(Preferences), useValue: preferencesRepo },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
  });

  describe("updateTenantProfile", () => {
    it("writes personal/contact fields onto the TENANT PROFILE (not the user)", async () => {
      const tenantProfile = {} as TenantProfile;
      const user = { id: "u-1", tenantProfile } as User;

      await service.updateTenantProfile(user, {
        full_name: "Jane Doe",
        first_name: "Jane",
        last_name: "Doe",
        address: "1 High St",
        phone: "+44 900",
        nationality: "British",
      } as any);

      expect(tenantProfile.full_name).toBe("Jane Doe");
      expect(tenantProfile.first_name).toBe("Jane");
      expect(tenantProfile.last_name).toBe("Doe");
      expect(tenantProfile.address).toBe("1 High St");
      expect(tenantProfile.phone).toBe("+44 900");
      expect(tenantProfile.nationality).toBe("British");
      // The user object is NOT mutated — duplication lives on the profile side.
      expect((user as any).phone).toBeUndefined();
      expect(tenantRepo.save).toHaveBeenCalledWith(tenantProfile);
    });

    it("parses a non-empty date_of_birth string into a Date", async () => {
      const tenantProfile = {} as TenantProfile;
      const user = { tenantProfile } as User;

      await service.updateTenantProfile(user, {
        date_of_birth: "1990-01-15",
      } as any);

      expect(tenantProfile.date_of_birth).toEqual(new Date("1990-01-15"));
    });

    it("clears date_of_birth when given an empty string", async () => {
      const tenantProfile = { date_of_birth: new Date() } as TenantProfile;
      const user = { tenantProfile } as User;

      await service.updateTenantProfile(user, { date_of_birth: "" } as any);

      expect(tenantProfile.date_of_birth).toBeUndefined();
    });

    it("throws NotFoundException when the tenant profile is missing", async () => {
      const user = { id: "u-1" } as User;

      await expect(
        service.updateTenantProfile(user, { phone: "x" } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("updateOperatorProfile", () => {
    it("writes personal + operator fields onto the OPERATOR PROFILE", async () => {
      const operatorProfile = {} as OperatorProfile;
      const user = { operatorProfile } as User;

      await service.updateOperatorProfile(user, {
        full_name: "Op Co",
        phone: "+44 111",
        nationality: "British",
        company_name: "Op Ltd",
        business_address: "2 Market St",
      } as any);

      expect(operatorProfile.full_name).toBe("Op Co");
      expect(operatorProfile.phone).toBe("+44 111");
      expect(operatorProfile.nationality).toBe("British");
      expect(operatorProfile.company_name).toBe("Op Ltd");
      expect(operatorProfile.business_address).toBe("2 Market St");
      expect(operatorRepo.save).toHaveBeenCalledWith(operatorProfile);
    });

    it("throws NotFoundException when the operator profile is missing", async () => {
      const user = {} as User;

      await expect(
        service.updateOperatorProfile(user, { phone: "x" } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

});
