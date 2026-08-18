import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserProfileService } from "./user-profile.service";
import { User } from "@/entities/user.entity";
import { Preferences } from "@/entities/preferences.entity";

/**
 * Characterization tests for the LIVE surface of UserProfileService.
 *
 * After the Users/Profiles consolidation, personal/contact fields are owned by
 * the users table, so this service only handles preferences-linked fields.
 * Deleting a user's owned rows is no longer its job: since 6.7 every table
 * referencing `users.id` cascades in the database.
 */
describe("UserProfileService (characterization)", () => {
  let service: UserProfileService;
  let preferencesRepo: { save: jest.Mock; create: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    const repoMock = () => ({
      save: jest.fn((entity) => Promise.resolve(entity)),
      create: jest.fn((entity) => entity),
      remove: jest.fn(() => Promise.resolve()),
    });
    preferencesRepo = repoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
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

});
