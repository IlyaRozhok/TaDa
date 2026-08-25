import { NotFoundException } from "@nestjs/common";
import { PreferencesService } from "./preferences.service";
import { Preferences } from "../../entities/preferences.entity";

/**
 * Regression suite for the `undefined`-vs-`null` trap: TypeORM's save()
 * silently drops `undefined` values from the UPDATE, so clearing a column
 * only works when the write is an explicit `null`. clear() used to assign
 * `undefined` to every scalar — the "cleared" budget, dates and smoker
 * survived in the database.
 */
describe("PreferencesService", () => {
  let service: PreferencesService;
  let preferencesRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
  };
  let userRepository: { findOne: jest.Mock; save: jest.Mock };
  let tenantCvService: { ensureShareUuid: jest.Mock };

  const storedPreferences = (): Partial<Preferences> => ({
    id: "pref-1",
    user_id: "user-1",
    preferred_address: "Camden",
    min_price: 1500,
    max_price: 3000,
    move_in_date: new Date("2026-09-01"),
    move_out_date: new Date("2027-09-01"),
    smoker: "no",
    balcony: true,
    let_duration: "12_months",
    bills: "included",
    number_of_pets: 1,
    occupation: "young-professional",
    family_status: "couple",
    children_count: "no",
    additional_info: "quiet",
    designer_furniture: true,
    preferred_areas: ["North"],
    property_types: ["apartment"],
    bedrooms: [2],
    amenities: ["Gym"],
    property_amenities: ["Dishwasher"],
    hobbies: ["Reading"],
  });

  beforeEach(() => {
    preferencesRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (entity) => entity),
      create: jest.fn((data) => data),
      remove: jest.fn(),
    };
    userRepository = { findOne: jest.fn(), save: jest.fn() };
    tenantCvService = { ensureShareUuid: jest.fn() };

    service = new PreferencesService(
      preferencesRepository as never,
      userRepository as never,
      tenantCvService as never
    );
  });

  describe("clear", () => {
    it("throws NotFoundException when the user has no preferences row", async () => {
      preferencesRepository.findOne.mockResolvedValue(null);

      await expect(service.clear("user-1")).rejects.toThrow(NotFoundException);
      expect(preferencesRepository.save).not.toHaveBeenCalled();
    });

    it("writes null (not undefined) to every nullable scalar so the UPDATE actually clears it", async () => {
      preferencesRepository.findOne.mockResolvedValue(storedPreferences());

      await service.clear("user-1");

      expect(preferencesRepository.save).toHaveBeenCalledTimes(1);
      const saved = preferencesRepository.save.mock.calls[0][0];

      const scalarFields = [
        "preferred_address",
        "move_in_date",
        "move_out_date",
        "min_price",
        "max_price",
        "balcony",
        "terrace",
        "min_square_meters",
        "max_square_meters",
        "let_duration",
        "bills",
        "pet_policy",
        "pets",
        "number_of_pets",
        "smoker",
        "occupation",
        "family_status",
        "children_count",
        "additional_info",
        "secondary_location",
        "min_bedrooms",
        "max_bedrooms",
        "min_bathrooms",
        "max_bathrooms",
        "designer_furniture",
      ] as const;

      for (const field of scalarFields) {
        // toBeNull (not toBeUndefined): undefined is exactly the regression.
        expect(saved[field]).toBeNull();
      }
    });

    it("resets every array preference to an empty array", async () => {
      preferencesRepository.findOne.mockResolvedValue(storedPreferences());

      await service.clear("user-1");

      const saved = preferencesRepository.save.mock.calls[0][0];
      const arrayFields = [
        "preferred_areas",
        "preferred_districts",
        "preferred_metro_stations",
        "property_types",
        "bedrooms",
        "bathrooms",
        "furnishing",
        "building_types",
        "tenant_types",
        "amenities",
        "property_amenities",
        "hobbies",
        "ideal_living_environment",
      ] as const;

      for (const field of arrayFields) {
        expect(saved[field]).toEqual([]);
      }
    });
  });
});
