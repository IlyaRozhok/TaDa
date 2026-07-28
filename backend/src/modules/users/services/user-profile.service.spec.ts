import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserProfileService } from "./user-profile.service";
import { User } from "../../../entities/user.entity";
import { TenantProfile } from "../../../entities/tenant-profile.entity";
import { OperatorProfile } from "../../../entities/operator-profile.entity";
import { Preferences } from "../../../entities/preferences.entity";

/**
 * Characterization tests for the LIVE surface of UserProfileService.
 *
 * After the Users/Profiles consolidation, personal/contact fields are owned by
 * the users table, so this service only handles preferences-linked fields and
 * cascade deletion of a user's owned rows.
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

  describe("updatePreferences", () => {
    it("maps a concrete pet type to a Pet[] and enables pet_policy", async () => {
      const preferences = {} as Preferences;
      const user = { preferences } as User;

      await service.updatePreferences(user, { pets: "dog" } as any);

      expect(preferences.pets).toEqual([{ type: "dog" }]);
      expect(preferences.pet_policy).toBe(true);
      expect(preferencesRepo.save).toHaveBeenCalledWith(preferences);
    });

    it('clears pets and pet_policy for "none"', async () => {
      const preferences = { pets: [{ type: "cat" }], pet_policy: true } as Preferences;
      const user = { preferences } as User;

      await service.updatePreferences(user, { pets: "none" } as any);

      expect(preferences.pets).toEqual([]);
      expect(preferences.pet_policy).toBe(false);
    });

    it("normalises smoker boolean to yes/no", async () => {
      const preferences = {} as Preferences;
      const user = { preferences } as User;

      await service.updatePreferences(user, { smoker: true } as any);
      expect(preferences.smoker).toBe("yes");

      await service.updatePreferences(user, { smoker: false } as any);
      expect(preferences.smoker).toBe("no");
    });

    it("throws NotFoundException when preferences are missing", async () => {
      await expect(
        service.updatePreferences({} as User, { smoker: true } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("deleteUserData", () => {
    it("removes preferences, tenant profile and operator profile when present", async () => {
      const preferences = { id: "p" } as Preferences;
      const tenantProfile = { id: "t" } as TenantProfile;
      const operatorProfile = { id: "o" } as OperatorProfile;
      const user = { preferences, tenantProfile, operatorProfile } as User;

      await service.deleteUserData(user);

      expect(preferencesRepo.remove).toHaveBeenCalledWith(preferences);
      expect(tenantRepo.remove).toHaveBeenCalledWith(tenantProfile);
      expect(operatorRepo.remove).toHaveBeenCalledWith(operatorProfile);
    });

    it("skips repositories for relations the user does not have", async () => {
      await service.deleteUserData({} as User);

      expect(preferencesRepo.remove).not.toHaveBeenCalled();
      expect(tenantRepo.remove).not.toHaveBeenCalled();
      expect(operatorRepo.remove).not.toHaveBeenCalled();
    });
  });
});
