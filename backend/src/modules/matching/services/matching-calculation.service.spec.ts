import { MatchingCalculationService } from "./matching-calculation.service";
import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import {
  CategoryMatchResult,
  DEFAULT_WEIGHTS,
  PropertyMatchResult,
} from "../interfaces/matching.interfaces";

/**
 * Characterization suite for the scoring engine, written against the
 * pre-decomposition service (step 6.3) and kept green through the split.
 *
 * Every expected number below was derived from the engine as it stands, not
 * from a spec of how it should behave — including the quirks (Math.round
 * turning a half-weight partial into the full weight, a pet-friendly property
 * scoring full marks when none of the user's pets are allowed). The suite
 * exists to freeze behavior, not to bless it.
 *
 * All categories are exercised through the public `calculateMatch` so the
 * tests survive any internal restructuring unchanged.
 */

const prop = (overrides: Partial<Property> = {}): Property =>
  ({ ...overrides }) as Property;

const prefs = (overrides: Partial<Preferences> = {}): Preferences =>
  ({ ...overrides }) as Preferences;

describe("MatchingCalculationService", () => {
  let service: MatchingCalculationService;

  const match = (
    property: Partial<Property>,
    preferences: Partial<Preferences>,
  ): PropertyMatchResult =>
    service.calculateMatch(prop(property), prefs(preferences), DEFAULT_WEIGHTS);

  const category = (
    result: PropertyMatchResult,
    name: string,
  ): CategoryMatchResult => {
    const found = result.categories.find((c) => c.category === name);
    if (!found) throw new Error(`Category ${name} missing from result`);
    return found;
  };

  const one = (
    name: string,
    property: Partial<Property>,
    preferences: Partial<Preferences>,
  ): CategoryMatchResult => category(match(property, preferences), name);

  beforeEach(() => {
    service = new MatchingCalculationService();
  });

  describe("result envelope", () => {
    it("always returns exactly 17 categories, location not among them", () => {
      const result = match({}, {});
      expect(result.categories).toHaveLength(17);
      expect(result.categories.map((c) => c.category)).toEqual([
        "budget",
        "bedrooms",
        "propertyType",
        "availability",
        "amenities",
        "bathrooms",
        "buildingStyle",
        "occupation",
        "familyStatus",
        "children",
        "duration",
        "squareMeters",
        "furnishing",
        "smoking",
        "pets",
        "bills",
        "propertyAmenities",
      ]);
    });

    it("scores 0% with all categories skipped when no preferences are set", () => {
      const result = match({ price: 1500, bedrooms: 2 }, {});
      expect(result.totalScore).toBe(0);
      expect(result.maxPossibleScore).toBe(0);
      expect(result.matchPercentage).toBe(0);
      expect(result.isPerfectMatch).toBe(false);
      expect(result.summary).toEqual({
        matched: 0,
        partial: 0,
        notMatched: 0,
        skipped: 17,
      });
    });

    it("is a perfect match when every set preference scores its full weight", () => {
      const result = match(
        { price: 1500, bedrooms: 2 },
        { min_price: 1000, max_price: 2000, bedrooms: [2] },
      );
      expect(result.totalScore).toBe(
        DEFAULT_WEIGHTS.budget + DEFAULT_WEIGHTS.bedrooms,
      );
      expect(result.maxPossibleScore).toBe(
        DEFAULT_WEIGHTS.budget + DEFAULT_WEIGHTS.bedrooms,
      );
      expect(result.matchPercentage).toBe(100);
      expect(result.isPerfectMatch).toBe(true);
      expect(result.summary).toEqual({
        matched: 2,
        partial: 0,
        notMatched: 0,
        skipped: 15,
      });
    });

    it("rounds the percentage and counts partial and missed categories", () => {
      // budget partial 9/18, bedrooms miss 0/12 -> 9/30 = 30%
      const result = match(
        { price: 2100, bedrooms: 5 },
        { max_price: 2000, bedrooms: [2] },
      );
      expect(result.totalScore).toBe(9);
      expect(result.maxPossibleScore).toBe(30);
      expect(result.matchPercentage).toBe(30);
      expect(result.summary).toEqual({
        matched: 0,
        partial: 1,
        notMatched: 1,
        skipped: 15,
      });
    });

    it("excludes skipped categories from the denominator entirely", () => {
      // Only bills set (weight 1, matched): 1/1 = 100% despite 16 skips
      const result = match({ bills: "included" }, { bills: "included" });
      expect(result.matchPercentage).toBe(100);
      expect(result.isPerfectMatch).toBe(true);
      expect(result.summary.skipped).toBe(16);
    });
  });

  describe("budget (weight 18)", () => {
    it("is skipped without a budget preference", () => {
      const c = one("budget", { price: 1500 }, {});
      expect(c).toMatchObject({ hasPreference: false, score: 0, maxScore: 0 });
    });

    it("scores full when price is within range", () => {
      const c = one(
        "budget",
        { price: 1500 },
        { min_price: 1000, max_price: 2000 },
      );
      expect(c).toMatchObject({ match: true, score: 18, maxScore: 18 });
    });

    it("treats a missing bound as open-ended", () => {
      const c = one("budget", { price: 5000 }, { min_price: 1000 });
      expect(c).toMatchObject({ match: true, score: 18 });
    });

    it("gives half score within 10% over max budget", () => {
      const c = one("budget", { price: 2100 }, { max_price: 2000 });
      expect(c).toMatchObject({ match: false, score: 9, maxScore: 18 });
    });

    it("gives zero beyond 10% over max budget", () => {
      const c = one("budget", { price: 2500 }, { max_price: 2000 });
      expect(c).toMatchObject({ match: false, score: 0 });
    });

    it("gives 70% score within 20% under min budget", () => {
      const c = one("budget", { price: 900 }, { min_price: 1000 });
      expect(c).toMatchObject({ match: false, score: 13 });
    });

    it("gives zero beyond 20% under min budget", () => {
      const c = one("budget", { price: 700 }, { min_price: 1000 });
      expect(c).toMatchObject({ match: false, score: 0 });
    });

    it("treats a missing price as 0 against the range", () => {
      const c = one("budget", {}, { min_price: 1000 });
      expect(c).toMatchObject({ match: false, score: 0, hasPreference: true });
    });
  });

  describe("bedrooms (weight 12)", () => {
    it("is skipped without a preference", () => {
      const c = one("bedrooms", { bedrooms: 2 }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("gives 30% when the property has no bedroom count", () => {
      const c = one("bedrooms", {}, { bedrooms: [2] });
      expect(c).toMatchObject({ match: false, score: 4, maxScore: 12 });
    });

    it("scores full on exact match", () => {
      const c = one("bedrooms", { bedrooms: 2 }, { bedrooms: [1, 2] });
      expect(c).toMatchObject({ match: true, score: 12 });
    });

    it("gives half score at exactly one bedroom outside the range", () => {
      expect(one("bedrooms", { bedrooms: 4 }, { bedrooms: [2, 3] })).toMatchObject(
        { match: false, score: 6 },
      );
      expect(one("bedrooms", { bedrooms: 1 }, { bedrooms: [2, 3] })).toMatchObject(
        { match: false, score: 6 },
      );
    });

    it("treats 0 bedrooms as a real count, not as missing", () => {
      const c = one("bedrooms", { bedrooms: 0 }, { bedrooms: [1] });
      expect(c).toMatchObject({ match: false, score: 6 });
    });

    it("gives zero two or more bedrooms away", () => {
      const c = one("bedrooms", { bedrooms: 5 }, { bedrooms: [2] });
      expect(c).toMatchObject({ match: false, score: 0 });
    });
  });

  describe("propertyType (weight 10)", () => {
    it("is skipped without a preference", () => {
      const c = one("propertyType", { property_type: "flat" }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("matches case-insensitively", () => {
      const c = one(
        "propertyType",
        { property_type: "Apartment" },
        { property_types: ["apartment"] },
      );
      expect(c).toMatchObject({ match: true, score: 10 });
    });

    it("gives zero on mismatch and on unknown property type", () => {
      expect(
        one(
          "propertyType",
          { property_type: "house" },
          { property_types: ["studio"] },
        ),
      ).toMatchObject({ match: false, score: 0 });
      expect(
        one("propertyType", {}, { property_types: ["studio"] }),
      ).toMatchObject({ match: false, score: 0, hasPreference: true });
    });
  });

  describe("availability (weight 8)", () => {
    it("is skipped without a move-in date", () => {
      const c = one("availability", { available_from: new Date() }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("gives half score, counted as match, when the property has no date", () => {
      const c = one("availability", {}, { move_in_date: new Date("2026-09-01") });
      expect(c).toMatchObject({ match: true, score: 4, maxScore: 8 });
    });

    it("scores full when available on or before move-in", () => {
      const c = one(
        "availability",
        { available_from: new Date("2026-08-15") },
        { move_in_date: new Date("2026-09-01") },
      );
      expect(c).toMatchObject({ match: true, score: 8 });
    });

    it("gives 70% up to 14 days late", () => {
      const c = one(
        "availability",
        { available_from: new Date("2026-09-10") },
        { move_in_date: new Date("2026-09-01") },
      );
      expect(c).toMatchObject({ match: false, score: 6 });
    });

    it("gives 40% up to 30 days late", () => {
      const c = one(
        "availability",
        { available_from: new Date("2026-09-25") },
        { move_in_date: new Date("2026-09-01") },
      );
      expect(c).toMatchObject({ match: false, score: 3 });
    });

    it("gives zero beyond 30 days late", () => {
      const c = one(
        "availability",
        { available_from: new Date("2026-11-01") },
        { move_in_date: new Date("2026-09-01") },
      );
      expect(c).toMatchObject({ match: false, score: 0 });
    });
  });

  describe("amenities (weight 8, includes balcony/terrace)", () => {
    it("is skipped without amenity or outdoor preferences", () => {
      const c = one("amenities", { amenities: ["wifi"] }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("scores full when everything requested is available", () => {
      const c = one(
        "amenities",
        { amenities: ["WiFi", "Gym"] },
        { amenities: ["wifi", "gym"] },
      );
      expect(c).toMatchObject({ match: true, score: 8 });
    });

    it("counts as match at ratio >= 0.6", () => {
      const c = one(
        "amenities",
        { amenities: ["wifi", "gym"] },
        { amenities: ["wifi", "gym", "pool"] },
      );
      expect(c).toMatchObject({ match: true, score: Math.round(8 * (2 / 3)) });
    });

    it("counts as partial below ratio 0.6", () => {
      const c = one(
        "amenities",
        { amenities: ["wifi"] },
        { amenities: ["wifi", "pool"] },
      );
      expect(c).toMatchObject({ match: false, score: 4 });
    });

    it("gives zero when nothing matches", () => {
      const c = one(
        "amenities",
        { amenities: ["parking"] },
        { amenities: ["wifi", "pool"] },
      );
      expect(c).toMatchObject({ match: false, score: 0 });
    });

    it("scores balcony and terrace as extra requested features", () => {
      expect(
        one("amenities", { balcony: true }, { balcony: true }),
      ).toMatchObject({ match: true, score: 8 });
      expect(one("amenities", {}, { terrace: true })).toMatchObject({
        match: false,
        score: 0,
        hasPreference: true,
      });
      // 1 amenity matched of 1 + terrace missing = 1/2
      expect(
        one(
          "amenities",
          { amenities: ["wifi"] },
          { amenities: ["wifi"], terrace: true },
        ),
      ).toMatchObject({ match: false, score: 4 });
    });
  });

  describe("bathrooms (weight 4)", () => {
    it("is skipped without a preference", () => {
      const c = one("bathrooms", { bathrooms: 2 }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("gives 30% when the property count is unknown", () => {
      const c = one("bathrooms", {}, { bathrooms: [1] });
      expect(c).toMatchObject({ match: false, score: 1, maxScore: 4 });
    });

    it("scores full on exact match", () => {
      const c = one("bathrooms", { bathrooms: 2 }, { bathrooms: [2] });
      expect(c).toMatchObject({ match: true, score: 4 });
    });

    it("rounds 90% back up to the full weight when there are more bathrooms", () => {
      // Math.round(4 * 0.9) = 4 — indistinguishable from a full match
      const c = one("bathrooms", { bathrooms: 3 }, { bathrooms: [1, 2] });
      expect(c).toMatchObject({ match: true, score: 4, maxScore: 4 });
    });

    it("gives zero with fewer bathrooms than preferred", () => {
      const c = one("bathrooms", { bathrooms: 1 }, { bathrooms: [2, 3] });
      expect(c).toMatchObject({ match: false, score: 0 });
    });
  });

  describe("buildingStyle (weight 4)", () => {
    it("is skipped without a preference", () => {
      const c = one("buildingStyle", { building_type: "new_build" }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("matches case-insensitively", () => {
      const c = one(
        "buildingStyle",
        { building_type: "New_Build" },
        { building_types: ["new_build"] },
      );
      expect(c).toMatchObject({ match: true, score: 4 });
    });

    it("gives zero on mismatch", () => {
      const c = one(
        "buildingStyle",
        { building_type: "period" },
        { building_types: ["new_build"] },
      );
      expect(c).toMatchObject({ match: false, score: 0 });
    });
  });

  describe("occupation (weight 6)", () => {
    it("is skipped without an occupation", () => {
      const c = one("occupation", { tenant_types: ["student"] }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("scores full when the property has no tenant type restrictions", () => {
      const c = one("occupation", {}, { occupation: "student" });
      expect(c).toMatchObject({ match: true, score: 6 });
    });

    it("scores full on a primary tenant-type match", () => {
      const c = one(
        "occupation",
        { tenant_types: ["Student"] },
        { occupation: "student" },
      );
      expect(c).toMatchObject({ match: true, score: 6 });
    });

    it("gives 70%, counted as match, on a secondary tenant-type match", () => {
      const c = one(
        "occupation",
        { tenant_types: ["sharers"] },
        { occupation: "student" },
      );
      expect(c).toMatchObject({ match: true, score: 4, maxScore: 6 });
    });

    it("gives zero when the occupation is unknown to the map", () => {
      const c = one(
        "occupation",
        { tenant_types: ["family"] },
        { occupation: "astronaut" },
      );
      expect(c).toMatchObject({ match: false, score: 0 });
    });

    it("gives zero on no compatibility", () => {
      const c = one(
        "occupation",
        { tenant_types: ["family"] },
        { occupation: "student" },
      );
      expect(c).toMatchObject({ match: false, score: 0 });
    });
  });

  describe("familyStatus (weight 5)", () => {
    it("is skipped without a family status", () => {
      const c = one("familyStatus", { tenant_types: ["family"] }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("scores full when the property has no restrictions", () => {
      const c = one("familyStatus", {}, { family_status: "couple" });
      expect(c).toMatchObject({ match: true, score: 5 });
    });

    it("scores full on a primary match", () => {
      const c = one(
        "familyStatus",
        { tenant_types: ["family"] },
        { family_status: "couple-with-children" },
      );
      expect(c).toMatchObject({ match: true, score: 5 });
    });

    it("gives 60%, counted as match, on a secondary match", () => {
      const c = one(
        "familyStatus",
        { tenant_types: ["family"] },
        { family_status: "couple" },
      );
      expect(c).toMatchObject({ match: true, score: 3, maxScore: 5 });
    });

    it("gives zero for an unknown status or no compatibility", () => {
      expect(
        one(
          "familyStatus",
          { tenant_types: ["family"] },
          { family_status: "commune" },
        ),
      ).toMatchObject({ match: false, score: 0 });
      expect(
        one(
          "familyStatus",
          { tenant_types: ["sharers"] },
          { family_status: "single-parent" },
        ),
      ).toMatchObject({ match: false, score: 0 });
    });
  });

  describe("children (weight 4)", () => {
    it("is skipped without a children preference", () => {
      const c = one("children", { tenant_types: ["family"] }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("scores full for a tenant with no children", () => {
      const c = one(
        "children",
        { tenant_types: ["sharers"] },
        { children_count: "no" },
      );
      expect(c).toMatchObject({ match: true, score: 4 });
    });

    it("scores full when the property has no tenant type restrictions", () => {
      const c = one("children", {}, { children_count: "yes-1-child" });
      expect(c).toMatchObject({ match: true, score: 4 });
    });

    it("gives zero when the property is not family-friendly", () => {
      const c = one(
        "children",
        { tenant_types: ["sharers", "student"] },
        { children_count: "yes-1-child" },
      );
      expect(c).toMatchObject({ match: false, score: 0 });
    });

    it("gives 70% for family-friendly with no explicit children policy", () => {
      const c = one(
        "children",
        { tenant_types: ["family"] },
        { children_count: "yes-2-children" },
      );
      expect(c).toMatchObject({ match: true, score: 3, maxScore: 4 });
    });

    it("gives zero when the property explicitly excludes children", () => {
      const c = one(
        "children",
        { tenant_types: ["family"], children: ["no"] as Property["children"] },
        { children_count: "yes-1-child" },
      );
      expect(c).toMatchObject({ match: false, score: 0 });
    });

    it("scores full when the property lists the exact children count", () => {
      const c = one(
        "children",
        {
          tenant_types: ["family"],
          children: ["yes-1-child"] as Property["children"],
        },
        { children_count: "yes-1-child" },
      );
      expect(c).toMatchObject({ match: true, score: 4 });
    });

    it("rounds 90% back up to full weight when capacity covers the count", () => {
      // Math.round(4 * 0.9) = 4
      const c = one(
        "children",
        {
          tenant_types: ["family"],
          children: ["yes-2-children"] as Property["children"],
        },
        { children_count: "yes-1-child" },
      );
      expect(c).toMatchObject({ match: true, score: 4 });
    });

    it("gives 30% when the property accepts fewer children than the tenant has", () => {
      const c = one(
        "children",
        {
          tenant_types: ["family"],
          children: ["yes-1-child"] as Property["children"],
        },
        { children_count: "yes-3-plus-children" },
      );
      expect(c).toMatchObject({ match: false, score: 1, maxScore: 4 });
    });

    it("falls back to 80% when the property policy parses to no capacity", () => {
      const c = one(
        "children",
        {
          tenant_types: ["family"],
          children: ["unrecognized"] as unknown as Property["children"],
        },
        { children_count: "yes-1-child" },
      );
      expect(c).toMatchObject({ match: true, score: 3, maxScore: 4 });
    });
  });

  describe("duration (weight 3)", () => {
    it("is skipped without a preference", () => {
      const c = one("duration", { let_duration: "long_term" }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("scores full when the property duration is missing or flexible", () => {
      expect(one("duration", {}, { let_duration: "short_term" })).toMatchObject(
        { match: true, score: 3 },
      );
      expect(
        one("duration", { let_duration: "Flexible" }, { let_duration: "short_term" }),
      ).toMatchObject({ match: true, score: 3 });
    });

    it("matches any value of comma-separated multiselects on both sides", () => {
      const c = one(
        "duration",
        { let_duration: "6_months, 12_months" },
        { let_duration: "12_months,short_term" },
      );
      expect(c).toMatchObject({ match: true, score: 3 });
    });

    it("gives 80%, counted as match, for same-family variants", () => {
      expect(
        one(
          "duration",
          { let_duration: "6_months" },
          { let_duration: "short_term" },
        ),
      ).toMatchObject({ match: true, score: 2, maxScore: 3 });
      expect(
        one(
          "duration",
          { let_duration: "medium_term" },
          { let_duration: "long_term" },
        ),
      ).toMatchObject({ match: true, score: 2 });
    });

    it("gives zero across families", () => {
      const c = one(
        "duration",
        { let_duration: "long_term" },
        { let_duration: "short_term" },
      );
      expect(c).toMatchObject({ match: false, score: 0 });
    });
  });

  describe("squareMeters (weight 2)", () => {
    it("is skipped without a preference", () => {
      const c = one("squareMeters", { square_meters: 50 }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("gives 30% when the property size is unknown", () => {
      const c = one("squareMeters", {}, { min_square_meters: 40 });
      expect(c).toMatchObject({ match: false, score: 1, maxScore: 2 });
    });

    it("scores full within range", () => {
      const c = one(
        "squareMeters",
        { square_meters: 50 },
        { min_square_meters: 40, max_square_meters: 60 },
      );
      expect(c).toMatchObject({ match: true, score: 2 });
    });

    it("gives 60% up to 15% under the minimum", () => {
      const c = one(
        "squareMeters",
        { square_meters: 45 },
        { min_square_meters: 50 },
      );
      expect(c).toMatchObject({ match: false, score: 1 });
    });

    it("gives zero further under the minimum, and zero over the maximum", () => {
      expect(
        one("squareMeters", { square_meters: 30 }, { min_square_meters: 50 }),
      ).toMatchObject({ match: false, score: 0 });
      expect(
        one("squareMeters", { square_meters: 80 }, { max_square_meters: 60 }),
      ).toMatchObject({ match: false, score: 0 });
    });
  });

  describe("furnishing (weight 1)", () => {
    it("is skipped without a preference", () => {
      const c = one("furnishing", { furnishing: "furnished" }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("matches case-insensitively", () => {
      const c = one(
        "furnishing",
        { furnishing: "Furnished" },
        { furnishing: ["furnished"] },
      );
      expect(c).toMatchObject({ match: true, score: 1 });
    });

    it("rounds the 50% partial for part-furnished up to the full weight", () => {
      // Math.round(1 * 0.5) = 1, but match stays false
      const c = one(
        "furnishing",
        { furnishing: "partially_furnished" },
        { furnishing: ["furnished"] },
      );
      expect(c).toMatchObject({ match: false, score: 1, maxScore: 1 });
    });

    it("gives zero on mismatch", () => {
      const c = one(
        "furnishing",
        { furnishing: "unfurnished" },
        { furnishing: ["furnished"] },
      );
      expect(c).toMatchObject({ match: false, score: 0 });
    });
  });

  describe("smoking (weight 1; property smoking area is hardcoded absent)", () => {
    it("is skipped without a preference or with no-preference", () => {
      expect(one("smoking", {}, {})).toMatchObject({ hasPreference: false });
      expect(one("smoking", {}, { smoker: "no-preference" })).toMatchObject({
        hasPreference: false,
      });
    });

    it("gives a smoker zero, since no property has a smoking area", () => {
      const c = one("smoking", {}, { smoker: "yes" });
      expect(c).toMatchObject({ match: false, score: 0, maxScore: 1 });
    });

    it("scores full for every non-smoking flavor", () => {
      for (const smoker of ["no", "no-prefer-non-smoking", "no-but-okay"]) {
        expect(one("smoking", {}, { smoker })).toMatchObject({
          match: true,
          score: 1,
        });
      }
    });

    it("scores full for an unrecognized value", () => {
      const c = one("smoking", {}, { smoker: "sometimes" });
      expect(c).toMatchObject({ match: true, score: 1 });
    });
  });

  describe("pets (weight 1)", () => {
    const pet = (type: string) => ({ type }) as NonNullable<Property["pets"]>[number];

    it("is skipped when the tenant has no pet requirements", () => {
      const c = one("pets", { pet_policy: true }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("gives zero when pets are needed but not allowed", () => {
      expect(one("pets", { pet_policy: false }, { pet_policy: true })).toMatchObject(
        { match: false, score: 0, maxScore: 1 },
      );
      expect(
        one("pets", {}, { pets: [pet("dog")] as Preferences["pets"] }),
      ).toMatchObject({ match: false, score: 0 });
    });

    it("scores full when all the tenant's pets are allowed, or 'all' is", () => {
      expect(
        one(
          "pets",
          { pet_policy: true, pets: [pet("dog"), pet("cat")] },
          { pets: [pet("dog")] as Preferences["pets"] },
        ),
      ).toMatchObject({ match: true, score: 1 });
      expect(
        one(
          "pets",
          { pet_policy: true, pets: [pet("all")] },
          { pets: [pet("snake")] as Preferences["pets"] },
        ),
      ).toMatchObject({ match: true, score: 1 });
    });

    it("rounds a half-allowed pet list up to the full weight, match false", () => {
      // 1 of 2 pets allowed: Math.round(1 * 0.5) = 1
      const c = one(
        "pets",
        { pet_policy: true, pets: [pet("dog")] },
        { pets: [pet("dog"), pet("cat")] as Preferences["pets"] },
      );
      expect(c).toMatchObject({ match: false, score: 1, maxScore: 1 });
    });

    it("scores full when the property allows pets but none of the tenant's kinds", () => {
      // Characterized quirk: the zero-overlap case falls through to the
      // generic "pet-friendly property" branch
      const c = one(
        "pets",
        { pet_policy: true, pets: [pet("dog")] },
        { pets: [pet("snake")] as Preferences["pets"] },
      );
      expect(c).toMatchObject({ match: true, score: 1 });
    });

    it("scores full for a pet-friendly property with no pet list", () => {
      const c = one("pets", { pet_policy: true }, { pet_policy: true });
      expect(c).toMatchObject({ match: true, score: 1 });
    });
  });

  describe("bills (weight 1)", () => {
    it("is skipped without a preference", () => {
      const c = one("bills", { bills: "included" }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("matches case-insensitively", () => {
      const c = one("bills", { bills: "Included" }, { bills: "included" });
      expect(c).toMatchObject({ match: true, score: 1 });
    });

    it("rounds the 60% some-included partial up to the full weight", () => {
      // Math.round(1 * 0.6) = 1, match stays false
      const c = one("bills", { bills: "some_included" }, { bills: "included" });
      expect(c).toMatchObject({ match: false, score: 1, maxScore: 1 });
    });

    it("gives zero on mismatch", () => {
      const c = one("bills", { bills: "excluded" }, { bills: "included" });
      expect(c).toMatchObject({ match: false, score: 0 });
    });
  });

  describe("propertyAmenities (weight 5)", () => {
    it("is skipped without a preference", () => {
      const c = one("propertyAmenities", { property_amenities: ["dishwasher"] }, {});
      expect(c).toMatchObject({ hasPreference: false, maxScore: 0 });
    });

    it("scores full when all features are available", () => {
      const c = one(
        "propertyAmenities",
        { property_amenities: ["Dishwasher", "Storage"] },
        { property_amenities: ["dishwasher", "storage"] },
      );
      expect(c).toMatchObject({ match: true, score: 5 });
    });

    it("counts as match at ratio >= 0.6", () => {
      const c = one(
        "propertyAmenities",
        { property_amenities: ["dishwasher", "storage"] },
        { property_amenities: ["dishwasher", "storage", "lift"] },
      );
      expect(c).toMatchObject({ match: true, score: Math.round(5 * (2 / 3)) });
    });

    it("counts as partial below 0.6, with half rounding up", () => {
      // Math.round(5 * 0.5) = 3
      const c = one(
        "propertyAmenities",
        { property_amenities: ["dishwasher"] },
        { property_amenities: ["dishwasher", "lift"] },
      );
      expect(c).toMatchObject({ match: false, score: 3, maxScore: 5 });
    });

    it("gives zero when nothing matches", () => {
      const c = one(
        "propertyAmenities",
        { property_amenities: ["dishwasher"] },
        { property_amenities: ["lift", "storage"] },
      );
      expect(c).toMatchObject({ match: false, score: 0 });
    });
  });
});
