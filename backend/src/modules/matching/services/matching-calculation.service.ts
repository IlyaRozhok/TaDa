import { Injectable } from "@nestjs/common";
import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import {
  CategoryWeights,
  CategoryMatchResult,
  PropertyMatchResult,
  DEFAULT_WEIGHTS,
} from "@/modules/matching/interfaces/matching.interfaces";
import { matchBudget } from "@/modules/matching/scoring/budget.scorer";
import { matchAvailability } from "@/modules/matching/scoring/availability.scorer";
import { matchPropertyType } from "@/modules/matching/scoring/property-type.scorer";
import { matchBedrooms } from "@/modules/matching/scoring/bedrooms.scorer";
import { matchBathrooms } from "@/modules/matching/scoring/bathrooms.scorer";
import { matchBuildingStyle } from "@/modules/matching/scoring/building-style.scorer";
import { matchDuration } from "@/modules/matching/scoring/duration.scorer";
import { matchSquareMeters } from "@/modules/matching/scoring/square-meters.scorer";
import { matchBills } from "@/modules/matching/scoring/bills.scorer";
import { matchOccupation } from "@/modules/matching/scoring/occupation.scorer";
import { matchFamilyStatus } from "@/modules/matching/scoring/family-status.scorer";
import { matchChildren } from "@/modules/matching/scoring/children.scorer";
import { matchSmoking } from "@/modules/matching/scoring/smoking.scorer";
import { matchAmenities } from "@/modules/matching/scoring/amenities.scorer";
import { matchFurnishing } from "@/modules/matching/scoring/furnishing.scorer";
import { matchPets } from "@/modules/matching/scoring/pets.scorer";
import { matchPropertyAmenities } from "@/modules/matching/scoring/property-amenities.scorer";

/**
 * Orchestrator of the scoring engine. Each category scorer is a pure
 * function in `../scoring/`; this service owns the category list, its
 * order, and the aggregation into a `PropertyMatchResult`.
 *
 * `scoring/location.scorer.ts` is deliberately NOT called here — location
 * was not among the seventeen categories before the 6.3 split, and wiring
 * it in would change every score.
 */
@Injectable()
export class MatchingCalculationService {
  /**
   * Calculate match score for a single property against preferences
   */
  calculateMatch(
    property: Property,
    preferences: Preferences,
    weights: CategoryWeights = DEFAULT_WEIGHTS,
  ): PropertyMatchResult {
    const categories: CategoryMatchResult[] = [];

    // 1. Budget matching
    categories.push(matchBudget(property, preferences, weights.budget));

    // 2. Bedrooms matching
    categories.push(matchBedrooms(property, preferences, weights.bedrooms));

    // 3. Property type matching
    categories.push(
      matchPropertyType(property, preferences, weights.propertyType),
    );

    // 4. Availability/Dates matching
    categories.push(
      matchAvailability(property, preferences, weights.availability),
    );

    // 5. Amenities matching (includes outdoor space)
    categories.push(matchAmenities(property, preferences, weights.amenities));

    // 6. Bathrooms matching
    categories.push(matchBathrooms(property, preferences, weights.bathrooms));

    // 7. Building style matching
    categories.push(
      matchBuildingStyle(property, preferences, weights.buildingStyle),
    );

    // 8. Occupation compatibility matching (ENHANCED)
    categories.push(
      matchOccupation(property, preferences, weights.occupation),
    );

    // 9. Family status compatibility matching (ENHANCED)
    categories.push(
      matchFamilyStatus(property, preferences, weights.familyStatus),
    );

    // 10. Children compatibility matching (ENHANCED)
    categories.push(matchChildren(property, preferences, weights.children));

    // 11. Duration matching
    categories.push(matchDuration(property, preferences, weights.duration));

    // 12. Square meters matching
    categories.push(
      matchSquareMeters(property, preferences, weights.squareMeters),
    );

    // 13. Furnishing matching
    categories.push(
      matchFurnishing(property, preferences, weights.furnishing),
    );

    // 14. Smoking compatibility matching
    categories.push(matchSmoking(property, preferences, weights.smoking));

    // 15. Pets matching
    categories.push(matchPets(property, preferences, weights.pets));

    // 16. Bills matching
    categories.push(matchBills(property, preferences, weights.bills));

    // 17. Property amenities matching (apartment-level features)
    categories.push(
      matchPropertyAmenities(
        property,
        preferences,
        weights.propertyAmenities,
      ),
    );

    // Calculate totals - ONLY include categories where user has set a preference
    // Categories without preferences are excluded from the calculation
    const categoriesWithPreference = categories.filter((c) => c.hasPreference);

    const totalScore = categoriesWithPreference.reduce(
      (sum, cat) => sum + cat.score,
      0,
    );
    const maxPossibleScore = categoriesWithPreference.reduce(
      (sum, cat) => sum + cat.maxScore,
      0,
    );

    // If no preferences set at all, matchPercentage = 0
    const matchPercentage =
      maxPossibleScore > 0
        ? Math.round((totalScore / maxPossibleScore) * 100)
        : 0;

    // Count category matches (only from categories with preferences)
    const matched = categoriesWithPreference.filter(
      (c) => c.match && c.score === c.maxScore,
    ).length;
    const partial = categoriesWithPreference.filter(
      (c) => c.score > 0 && c.score < c.maxScore,
    ).length;
    const notMatched = categoriesWithPreference.filter(
      (c) => c.score === 0 && c.maxScore > 0,
    ).length;
    const skipped = categories.filter((c) => !c.hasPreference).length;

    return {
      property,
      totalScore,
      maxPossibleScore,
      matchPercentage,
      isPerfectMatch:
        matchPercentage === 100 && categoriesWithPreference.length > 0,
      categories,
      summary: { matched, partial, notMatched, skipped },
    };
  }
}
