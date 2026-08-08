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
    categories.push(
      this.matchAmenities(property, preferences, weights.amenities),
    );

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
      this.matchFurnishing(property, preferences, weights.furnishing),
    );

    // 14. Smoking compatibility matching
    categories.push(matchSmoking(property, preferences, weights.smoking));

    // 15. Pets matching
    categories.push(this.matchPets(property, preferences, weights.pets));

    // 16. Bills matching
    categories.push(matchBills(property, preferences, weights.bills));

    // 17. Property amenities matching (apartment-level features)
    categories.push(
      this.matchPropertyAmenities(property, preferences, weights.propertyAmenities),
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



  /**
   * 12. Pets matching
   */
  private matchPets(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const needsPetFriendly = preferences.pet_policy === true;
    const userPets = preferences.pets || [];
    const propertyAllowsPets = property.pet_policy === true;
    const allowedPets = property.pets || [];

    // User doesn't have pets and doesn't need pet-friendly - exclude from calculation
    if (!needsPetFriendly && userPets.length === 0) {
      return {
        category: "pets",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No pet requirements",
        details: "You don't require a pet-friendly property",
        hasPreference: false,
      };
    }

    // User has pets but property doesn't allow
    if ((needsPetFriendly || userPets.length > 0) && !propertyAllowsPets) {
      return {
        category: "pets",
        match: false,
        score: 0,
        maxScore,
        reason: "Pets not allowed",
        details: "This property does not allow pets",
        hasPreference: true,
      };
    }

    // Property allows pets
    if (propertyAllowsPets) {
      // Check specific pet compatibility if user has specified pets
      if (userPets.length > 0 && allowedPets.length > 0) {
        const userPetTypes = userPets.map((p) => p.type?.toLowerCase());
        const allowedPetTypes = allowedPets.map((p) => p.type?.toLowerCase());

        const allPetsAllowed = userPetTypes.every(
          (type) =>
            allowedPetTypes.includes(type) || allowedPetTypes.includes("all"),
        );

        if (allPetsAllowed) {
          return {
            category: "pets",
            match: true,
            score: maxScore,
            maxScore,
            reason: "Pet-friendly",
            details: `Allows: ${allowedPets.map((p) => p.type).join(", ")}`,
            hasPreference: true,
          };
        }

        // Partial match
        const matchedPets = userPetTypes.filter(
          (type) =>
            allowedPetTypes.includes(type) || allowedPetTypes.includes("all"),
        );

        if (matchedPets.length > 0) {
          return {
            category: "pets",
            match: false,
            score: Math.round(
              maxScore * (matchedPets.length / userPetTypes.length),
            ),
            maxScore,
            reason: "Some pets allowed",
            details: `Allows: ${allowedPets.map((p) => p.type).join(", ")}`,
            hasPreference: true,
          };
        }
      }

      return {
        category: "pets",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Pet-friendly property",
        details: allowedPets.length
          ? `Allows: ${allowedPets.map((p) => p.type).join(", ")}`
          : "Pets allowed",
        hasPreference: true,
      };
    }

    return {
      category: "pets",
      match: false,
      score: 0,
      maxScore,
      reason: "Pet policy unclear",
      details: "Pet policy not specified",
      hasPreference: true,
    };
  }

  /**
   * Amenities matching - IMPROVED
   * Includes outdoor space features as part of amenities scoring
   */
  private matchAmenities(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const prefAmenities = preferences.amenities || [];
    const propertyAmenities = property.amenities || [];

    // Check outdoor space preferences
    const wantsOutdoor = false;
    const wantsBalcony = preferences.balcony === true;
    const wantsTerrace = preferences.terrace === true;
    const hasOutdoorPrefs = wantsOutdoor || wantsBalcony || wantsTerrace;

    // No preference set - exclude from calculation
    if (!prefAmenities.length && !hasOutdoorPrefs) {
      return {
        category: "amenities",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No amenity preferences",
        details: propertyAmenities.length
          ? `Available: ${propertyAmenities.slice(0, 3).join(", ")}${
              propertyAmenities.length > 3 ? "..." : ""
            }`
          : "No amenities listed",
        hasPreference: false,
      };
    }

    let totalRequested = prefAmenities.length;
    let matchedCount = 0;

    // Match regular amenities
    if (prefAmenities.length > 0) {
      const normalizedPref = prefAmenities.map((a) => a.toLowerCase());
      const normalizedProp = propertyAmenities.map((a) => a.toLowerCase());
      const matched = normalizedPref.filter((a) => normalizedProp.includes(a));
      matchedCount += matched.length;
    }

    // Add outdoor space preferences to scoring (balcony/terrace only)
    if (hasOutdoorPrefs) {
      const outdoorFeatures: string[] = [];
      if (wantsBalcony) {
        totalRequested++;
        if (property.balcony) {
          matchedCount++;
          outdoorFeatures.push("balcony");
        }
      }
      if (wantsTerrace) {
        totalRequested++;
        if (property.terrace) {
          matchedCount++;
          outdoorFeatures.push("terrace");
        }
      }
    }

    const matchRatio = totalRequested > 0 ? matchedCount / totalRequested : 0;

    // Build details
    const details: string[] = [];
    if (matchedCount > 0) {
      details.push(`${matchedCount} of ${totalRequested} features available`);
    }
    if (property.balcony) details.push("balcony");
    if (property.terrace) details.push("terrace");

    if (matchRatio === 1) {
      return {
        category: "amenities",
        match: true,
        score: maxScore,
        maxScore,
        reason: "All amenities & features available",
        details: details.join(", "),
        hasPreference: true,
      };
    }

    if (matchRatio >= 0.6) {
      return {
        category: "amenities",
        match: true,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Most amenities & features available",
        details: details.length > 0 ? details.join(", ") : "Good match",
        hasPreference: true,
      };
    }

    if (matchRatio > 0) {
      return {
        category: "amenities",
        match: false,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Some amenities & features available",
        details: details.length > 0 ? details.join(", ") : "Partial match",
        hasPreference: true,
      };
    }

    return {
      category: "amenities",
      match: false,
      score: 0,
      maxScore,
      reason: "Preferred amenities & features not available",
      details: `Missing ${totalRequested} requested features`,
      hasPreference: true,
    };
  }


  /**
   * Property amenities matching
   * Matches apartment-level features (kitchen, bathroom, storage, tech, access)
   */
  private matchPropertyAmenities(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const prefFeatures = preferences.property_amenities || [];
    const propertyFeatures = property.property_amenities || [];

    if (!prefFeatures.length) {
      return {
        category: "propertyAmenities",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No apartment feature preferences set",
        details: propertyFeatures.length
          ? `Available: ${propertyFeatures.slice(0, 3).join(", ")}${propertyFeatures.length > 3 ? "..." : ""}`
          : "No features listed",
        hasPreference: false,
      };
    }

    const normalizedPref = prefFeatures.map((f) => f.toLowerCase());
    const normalizedProp = propertyFeatures.map((f) => f.toLowerCase());
    const matchedCount = normalizedPref.filter((f) =>
      normalizedProp.includes(f),
    ).length;
    const matchRatio = matchedCount / prefFeatures.length;

    const details = `${matchedCount} of ${prefFeatures.length} features available`;

    if (matchRatio === 1) {
      return {
        category: "propertyAmenities",
        match: true,
        score: maxScore,
        maxScore,
        reason: "All apartment features available",
        details,
        hasPreference: true,
      };
    }

    if (matchRatio >= 0.6) {
      return {
        category: "propertyAmenities",
        match: true,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Most apartment features available",
        details,
        hasPreference: true,
      };
    }

    if (matchRatio > 0) {
      return {
        category: "propertyAmenities",
        match: false,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Some apartment features available",
        details,
        hasPreference: true,
      };
    }

    return {
      category: "propertyAmenities",
      match: false,
      score: 0,
      maxScore,
      reason: "Preferred apartment features not available",
      details: `Missing ${prefFeatures.length} requested features`,
      hasPreference: true,
    };
  }

  private getOutdoorSpaceDetails(property: Property): string {
    const features: string[] = [];
    if (property.balcony) features.push("Balcony");
    if (property.terrace) features.push("Terrace");
    return features.length ? features.join(", ") : "No outdoor space";
  }

  /**
   * 15. Furnishing matching
   */
  private matchFurnishing(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const prefFurnishing = preferences.furnishing || [];
    const propertyFurnishing = property.furnishing?.toLowerCase();

    // No preference set - exclude from calculation
    if (!prefFurnishing.length) {
      return {
        category: "furnishing",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No furnishing preference",
        details: `Furnishing: ${propertyFurnishing || "Not specified"}`,
        hasPreference: false,
      };
    }

    // Check match
    const normalizedPref = prefFurnishing.map((f) => f.toLowerCase());
    const matches =
      propertyFurnishing && normalizedPref.includes(propertyFurnishing);

    if (matches) {
      return {
        category: "furnishing",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Furnishing matches",
        details: `${propertyFurnishing} matches your preference`,
        hasPreference: true,
      };
    }

    // Partial match: part-furnished can be acceptable for either preference
    if (
      propertyFurnishing === "partially_furnished" ||
      propertyFurnishing === "part-furnished"
    ) {
      return {
        category: "furnishing",
        match: false,
        score: Math.round(maxScore * 0.5),
        maxScore,
        reason: "Partially furnished",
        details: "Property is partially furnished",
        hasPreference: true,
      };
    }

    return {
      category: "furnishing",
      match: false,
      score: 0,
      maxScore,
      reason: "Furnishing doesn't match",
      details: `${
        propertyFurnishing || "Unknown"
      }, you prefer ${prefFurnishing.join(" or ")}`,
      hasPreference: true,
    };
  }

  /**
   * Location matching (areas, districts, metro stations) - IMPROVED
   * Checks multiple location criteria with weighted scoring
   */
  private matchLocation(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const prefAreas = preferences.preferred_areas || [];
    const prefDistricts = preferences.preferred_districts || [];
    const prefMetro = preferences.preferred_metro_stations || [];
    const propertyAddress = property.address?.toLowerCase() || "";
    const propertyMetro = property.metro_stations || [];

    const hasAnyPreference =
      prefAreas.length > 0 || prefDistricts.length > 0 || prefMetro.length > 0;

    // No preference set - exclude from calculation
    if (!hasAnyPreference) {
      return {
        category: "location",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No location preference",
        details: propertyMetro.length
          ? `Near: ${propertyMetro
              .slice(0, 2)
              .map((m) => m.label)
              .join(", ")}`
          : "Location info not available",
        hasPreference: false,
      };
    }

    let matchedCriteria = 0;
    let totalCriteria = 0;
    const matchDetails: string[] = [];

    // Check area matches (e.g., "West London", "Central")
    if (prefAreas.length > 0) {
      totalCriteria++;
      const normalizedPrefAreas = prefAreas.map((a) => a.toLowerCase());
      const areaMatch = normalizedPrefAreas.some(
        (area) =>
          propertyAddress.includes(area) ||
          propertyMetro.some((m) => m.label?.toLowerCase().includes(area)),
      );
      if (areaMatch) {
        matchedCriteria++;
        matchDetails.push("Area matches");
      }
    }

    // Check district/borough matches (e.g., "Camden", "Westminster")
    if (prefDistricts.length > 0) {
      totalCriteria++;
      const normalizedPrefDistricts = prefDistricts.map((d) => d.toLowerCase());
      const districtMatch = normalizedPrefDistricts.some(
        (district) =>
          propertyAddress.includes(district) ||
          propertyMetro.some((m) => m.label?.toLowerCase().includes(district)),
      );
      if (districtMatch) {
        matchedCriteria++;
        matchDetails.push("District matches");
      }
    }

    // Check metro station matches - most specific
    if (prefMetro.length > 0) {
      totalCriteria++;
      if (propertyMetro.length > 0) {
        const propMetroLabels = propertyMetro.map((m) =>
          m.label?.toLowerCase(),
        );
        const prefMetroNormalized = prefMetro.map((m) => m.toLowerCase());

        // Check for exact or partial metro matches
        const exactMatch = prefMetroNormalized.some((pm) =>
          propMetroLabels.some((pml) => pml === pm),
        );

        const partialMatch = prefMetroNormalized.some((pm) =>
          propMetroLabels.some(
            (pml) => pml?.includes(pm) || pm.includes(pml || ""),
          ),
        );

        if (exactMatch) {
          matchedCriteria += 1;
          matchDetails.push("Metro station matches exactly");
        } else if (partialMatch) {
          matchedCriteria += 0.7; // Partial credit for similar metro names
          matchDetails.push("Near preferred metro");
        }
      }
    }

    // Calculate match ratio
    const matchRatio = totalCriteria > 0 ? matchedCriteria / totalCriteria : 0;

    // Perfect match - all location criteria matched
    if (matchRatio === 1) {
      return {
        category: "location",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Perfect location match",
        details: matchDetails.join(", "),
        hasPreference: true,
      };
    }

    // Good match - most criteria matched
    if (matchRatio >= 0.6) {
      return {
        category: "location",
        match: true,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Good location match",
        details:
          matchDetails.length > 0
            ? matchDetails.join(", ")
            : `Near: ${propertyMetro
                .slice(0, 2)
                .map((m) => m.label)
                .join(", ")}`,
        hasPreference: true,
      };
    }

    // Partial match - some criteria matched
    if (matchRatio > 0) {
      return {
        category: "location",
        match: false,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Partial location match",
        details:
          matchDetails.length > 0
            ? matchDetails.join(", ")
            : "Some location criteria match",
        hasPreference: true,
      };
    }

    // No match
    return {
      category: "location",
      match: false,
      score: 0,
      maxScore,
      reason: "Location doesn't match",
      details: "Not in preferred areas or near preferred metro stations",
      hasPreference: true,
    };
  }
}
