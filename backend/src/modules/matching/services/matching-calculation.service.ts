import { Injectable } from "@nestjs/common";
import { Property } from "../../../entities/property.entity";
import { Preferences } from "../../../entities/preferences.entity";
import {
  CategoryWeights,
  CategoryMatchResult,
  PropertyMatchResult,
  DEFAULT_WEIGHTS,
} from "../interfaces/matching.interfaces";

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
    categories.push(this.matchBudget(property, preferences, weights.budget));

    // 2. Location matching (areas, districts, metro) - HIGH PRIORITY
    categories.push(
      this.matchLocation(property, preferences, weights.location),
    );

    // 3. Bedrooms matching
    categories.push(
      this.matchBedrooms(property, preferences, weights.bedrooms),
    );

    // 4. Property type matching
    categories.push(
      this.matchPropertyType(property, preferences, weights.propertyType),
    );

    // 5. Availability/Dates matching
    categories.push(
      this.matchAvailability(property, preferences, weights.availability),
    );

    // 6. Amenities matching (includes outdoor space)
    categories.push(
      this.matchAmenities(property, preferences, weights.amenities),
    );

    // 7. Bathrooms matching
    categories.push(
      this.matchBathrooms(property, preferences, weights.bathrooms),
    );

    // 8. Building style matching
    categories.push(
      this.matchBuildingStyle(property, preferences, weights.buildingStyle),
    );

    // 9. Lifestyle compatibility matching (NEW)
    categories.push(
      this.matchLifestyle(property, preferences, weights.lifestyle),
    );

    // 10. Duration matching
    categories.push(
      this.matchDuration(property, preferences, weights.duration),
    );

    // 11. Square meters matching
    categories.push(
      this.matchSquareMeters(property, preferences, weights.squareMeters),
    );

    // 12. Furnishing matching
    categories.push(
      this.matchFurnishing(property, preferences, weights.furnishing),
    );

    // 13. Smoking compatibility matching (NEW)
    categories.push(
      this.matchSmoking(property, preferences, weights.smoking),
    );

    // 14. Pets matching
    categories.push(this.matchPets(property, preferences, weights.pets));

    // 15. Bills matching
    categories.push(this.matchBills(property, preferences, weights.bills));

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
   * 1. Budget matching: min_price/max_price vs property.price
   */
  private matchBudget(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const price = Number(property.price) || 0;
    const minPrice = preferences.min_price;
    const maxPrice = preferences.max_price;

    // No preference set - exclude from calculation
    if (!minPrice && !maxPrice) {
      return {
        category: "budget",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No budget preference set",
        details: `Property price: £${price}/month`,
        hasPreference: false,
      };
    }

    // Check if within range
    const isWithinMin = !minPrice || price >= minPrice;
    const isWithinMax = !maxPrice || price <= maxPrice;

    if (isWithinMin && isWithinMax) {
      return {
        category: "budget",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Within budget",
        details: `£${price}/month is within £${minPrice || 0}-£${
          maxPrice || "∞"
        } range`,
        hasPreference: true,
      };
    }

    // Calculate partial score for close matches
    if (maxPrice && price > maxPrice) {
      const overBy = ((price - maxPrice) / maxPrice) * 100;
      if (overBy <= 10) {
        // Within 10% over budget - partial match
        const partialScore = Math.round(maxScore * 0.5);
        return {
          category: "budget",
          match: false,
          score: partialScore,
          maxScore,
          reason: "Slightly over budget",
          details: `£${price}/month is ${overBy.toFixed(
            1,
          )}% over max budget of £${maxPrice}`,
          hasPreference: true,
        };
      }
    }

    if (minPrice && price < minPrice) {
      const underBy = ((minPrice - price) / minPrice) * 100;
      if (underBy <= 20) {
        // Within 20% under budget - partial match (might be lower quality)
        const partialScore = Math.round(maxScore * 0.7);
        return {
          category: "budget",
          match: false,
          score: partialScore,
          maxScore,
          reason: "Under budget",
          details: `£${price}/month is ${underBy.toFixed(
            1,
          )}% under min budget of £${minPrice}`,
          hasPreference: true,
        };
      }
    }

    return {
      category: "budget",
      match: false,
      score: 0,
      maxScore,
      reason: "Outside budget range",
      details: `£${price}/month is outside £${minPrice || 0}-£${
        maxPrice || "∞"
      } range`,
      hasPreference: true,
    };
  }

  /**
   * 2. Availability matching: move_in_date vs property.available_from
   */
  private matchAvailability(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const moveInDate = preferences.move_in_date;
    const availableFrom = property.available_from;

    // No preference set - exclude from calculation
    if (!moveInDate) {
      return {
        category: "availability",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No move-in date preference",
        details: availableFrom
          ? `Available from ${new Date(availableFrom).toLocaleDateString()}`
          : "Availability not specified",
        hasPreference: false,
      };
    }

    // Property has no availability date
    if (!availableFrom) {
      return {
        category: "availability",
        match: true,
        score: Math.round(maxScore * 0.5),
        maxScore,
        reason: "Availability not specified",
        details: "Contact property for availability",
        hasPreference: true,
      };
    }

    const moveIn = new Date(moveInDate);
    const available = new Date(availableFrom);

    // Property available before or on move-in date
    if (available <= moveIn) {
      return {
        category: "availability",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Available on time",
        details: `Available from ${available.toLocaleDateString()}, move-in ${moveIn.toLocaleDateString()}`,
        hasPreference: true,
      };
    }

    // Property available after move-in date
    const daysDiff = Math.ceil(
      (available.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff <= 14) {
      // Within 2 weeks - partial match
      return {
        category: "availability",
        match: false,
        score: Math.round(maxScore * 0.7),
        maxScore,
        reason: "Available soon",
        details: `Available ${daysDiff} days after preferred move-in date`,
        hasPreference: true,
      };
    }

    if (daysDiff <= 30) {
      // Within 1 month - lower partial match
      return {
        category: "availability",
        match: false,
        score: Math.round(maxScore * 0.4),
        maxScore,
        reason: "Available within a month",
        details: `Available ${daysDiff} days after preferred move-in date`,
        hasPreference: true,
      };
    }

    return {
      category: "availability",
      match: false,
      score: 0,
      maxScore,
      reason: "Not available in time",
      details: `Available ${daysDiff} days after preferred move-in date`,
      hasPreference: true,
    };
  }


  /**
   * 4. Property type matching
   */
  private matchPropertyType(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const prefTypes = preferences.property_types || [];
    const propertyType = property.property_type?.toLowerCase();

    // No preference set - exclude from calculation
    if (!prefTypes.length) {
      return {
        category: "propertyType",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No property type preference",
        details: `Property type: ${propertyType || "Not specified"}`,
        hasPreference: false,
      };
    }

    // Check if property type matches any preference
    const normalizedPrefTypes = prefTypes.map((t) => t.toLowerCase());
    const matches = propertyType && normalizedPrefTypes.includes(propertyType);

    if (matches) {
      return {
        category: "propertyType",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Property type matches",
        details: `${propertyType} is in your preferred types`,
        hasPreference: true,
      };
    }

    return {
      category: "propertyType",
      match: false,
      score: 0,
      maxScore,
      reason: "Property type doesn't match",
      details: `${
        propertyType || "Unknown"
      } is not in your preferred types (${prefTypes.join(", ")})`,
      hasPreference: true,
    };
  }

  /**
   * 5. Bedrooms matching
   */
  private matchBedrooms(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const prefBedrooms = preferences.bedrooms || [];
    const propertyBedrooms = property.bedrooms;

    // No preference set - exclude from calculation
    if (!prefBedrooms.length) {
      return {
        category: "bedrooms",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No bedroom preference",
        details: `Property has ${propertyBedrooms || 0} bedrooms`,
        hasPreference: false,
      };
    }

    // Property has no bedroom info
    if (propertyBedrooms === null || propertyBedrooms === undefined) {
      return {
        category: "bedrooms",
        match: false,
        score: Math.round(maxScore * 0.3),
        maxScore,
        reason: "Bedroom count unknown",
        details: "Property bedroom count not specified",
        hasPreference: true,
      };
    }

    // Exact match
    if (prefBedrooms.includes(propertyBedrooms)) {
      return {
        category: "bedrooms",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Bedroom count matches",
        details: `${propertyBedrooms} bedrooms matches your preference`,
        hasPreference: true,
      };
    }

    // Check for close match (±1 bedroom)
    const minPref = Math.min(...prefBedrooms);
    const maxPref = Math.max(...prefBedrooms);

    if (propertyBedrooms === minPref - 1 || propertyBedrooms === maxPref + 1) {
      return {
        category: "bedrooms",
        match: false,
        score: Math.round(maxScore * 0.5),
        maxScore,
        reason: "Close to preferred bedroom count",
        details: `${propertyBedrooms} bedrooms is close to your preference (${prefBedrooms.join(
          ", ",
        )})`,
        hasPreference: true,
      };
    }

    return {
      category: "bedrooms",
      match: false,
      score: 0,
      maxScore,
      reason: "Bedroom count doesn't match",
      details: `${propertyBedrooms} bedrooms, you prefer ${prefBedrooms.join(
        ", ",
      )}`,
      hasPreference: true,
    };
  }

  /**
   * 6. Bathrooms matching
   */
  private matchBathrooms(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const prefBathrooms = preferences.bathrooms || [];
    const propertyBathrooms = property.bathrooms;

    // No preference set - exclude from calculation
    if (!prefBathrooms.length) {
      return {
        category: "bathrooms",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No bathroom preference",
        details: `Property has ${propertyBathrooms || 0} bathrooms`,
        hasPreference: false,
      };
    }

    // Property has no bathroom info
    if (propertyBathrooms === null || propertyBathrooms === undefined) {
      return {
        category: "bathrooms",
        match: false,
        score: Math.round(maxScore * 0.3),
        maxScore,
        reason: "Bathroom count unknown",
        details: "Property bathroom count not specified",
        hasPreference: true,
      };
    }

    // Exact match
    if (prefBathrooms.includes(propertyBathrooms)) {
      return {
        category: "bathrooms",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Bathroom count matches",
        details: `${propertyBathrooms} bathrooms matches your preference`,
        hasPreference: true,
      };
    }

    // More bathrooms than required is usually fine
    if (propertyBathrooms > Math.max(...prefBathrooms)) {
      return {
        category: "bathrooms",
        match: true,
        score: Math.round(maxScore * 0.9),
        maxScore,
        reason: "More bathrooms than required",
        details: `${propertyBathrooms} bathrooms exceeds your preference`,
        hasPreference: true,
      };
    }

    return {
      category: "bathrooms",
      match: false,
      score: 0,
      maxScore,
      reason: "Bathroom count doesn't match",
      details: `${propertyBathrooms} bathrooms, you prefer ${prefBathrooms.join(
        ", ",
      )}`,
      hasPreference: true,
    };
  }

  /**
   * 7. Building style matching
   */
  private matchBuildingStyle(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const prefStyles = preferences.building_types || [];
    const buildingType = property.building_type?.toLowerCase();

    // No preference set - exclude from calculation
    if (!prefStyles.length) {
      return {
        category: "buildingStyle",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No building style preference",
        details: `Building type: ${buildingType || "Not specified"}`,
        hasPreference: false,
      };
    }

    // Check match
    const normalizedPrefStyles = prefStyles.map((s) => s.toLowerCase());
    const matches = buildingType && normalizedPrefStyles.includes(buildingType);

    if (matches) {
      return {
        category: "buildingStyle",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Building style matches",
        details: `${buildingType} matches your preference`,
        hasPreference: true,
      };
    }

    return {
      category: "buildingStyle",
      match: false,
      score: 0,
      maxScore,
      reason: "Building style doesn't match",
      details: `${buildingType || "Unknown"} is not in your preferences`,
      hasPreference: true,
    };
  }

  /**
   * 8. Duration matching
   */
  private matchDuration(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const prefDurationRaw = preferences.let_duration;
    const propertyDuration = property.let_duration?.toLowerCase();

    // Support comma-separated multiselect (preferences and property)
    const prefDurations = prefDurationRaw
      ? prefDurationRaw.split(",").map((s) => s.trim().toLowerCase())
      : [];

    // No preference set - exclude from calculation
    if (prefDurations.length === 0) {
      return {
        category: "duration",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No duration preference",
        details: `Let duration: ${propertyDuration || "Flexible"}`,
        hasPreference: false,
      };
    }

    // Property has no duration or is flexible
    if (!propertyDuration || propertyDuration === "flexible") {
      return {
        category: "duration",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Flexible duration",
        details: "Property offers flexible let duration",
        hasPreference: true,
      };
    }

    // Property may be comma-separated (multiselect)
    const propertyDurations = propertyDuration
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // Match if any preference duration matches any property duration
    const prefSet = new Set(prefDurations);
    const hasExactMatch = propertyDurations.some((pd) => prefSet.has(pd));
    if (hasExactMatch) {
      return {
        category: "duration",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Duration matches",
        details: `${propertyDuration} matches your preference`,
        hasPreference: true,
      };
    }

    // Partial match for similar durations (short/long term variants)
    const shortTermVariants = [
      "short_term",
      "short-term",
      "6_months",
      "6-months",
    ];
    const longTermVariants = [
      "long_term",
      "long-term",
      "12_months",
      "12-months",
    ];

    const prefIsShort = prefDurations.some((p) =>
      shortTermVariants.includes(p),
    );
    const propIsShort = propertyDurations.some((p) =>
      shortTermVariants.includes(p),
    );
    const prefIsLong = prefDurations.some((p) => longTermVariants.includes(p));
    const propIsLong = propertyDurations.some((p) =>
      longTermVariants.includes(p),
    );

    if ((prefIsShort && propIsShort) || (prefIsLong && propIsLong)) {
      return {
        category: "duration",
        match: true,
        score: Math.round(maxScore * 0.8),
        maxScore,
        reason: "Similar duration",
        details: `${propertyDuration} is similar to your preference`,
        hasPreference: true,
      };
    }

    return {
      category: "duration",
      match: false,
      score: 0,
      maxScore,
      reason: "Duration doesn't match",
      details: `${propertyDuration}, you prefer ${prefDurations.join(", ")}`,
      hasPreference: true,
    };
  }

  /**
   * 9. Square meters matching
   */
  private matchSquareMeters(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const minSqm = preferences.min_square_meters;
    const maxSqm = preferences.max_square_meters;
    const propertySqm = Number(property.square_meters) || 0;

    // No preference set - exclude from calculation
    if (!minSqm && !maxSqm) {
      return {
        category: "squareMeters",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No size preference",
        details: propertySqm ? `${propertySqm} sqm` : "Size not specified",
        hasPreference: false,
      };
    }

    // Property has no size info
    if (!propertySqm) {
      return {
        category: "squareMeters",
        match: false,
        score: Math.round(maxScore * 0.3),
        maxScore,
        reason: "Size not specified",
        details: "Property size information not available",
        hasPreference: true,
      };
    }

    // Check if within range
    const isWithinMin = !minSqm || propertySqm >= minSqm;
    const isWithinMax = !maxSqm || propertySqm <= maxSqm;

    if (isWithinMin && isWithinMax) {
      return {
        category: "squareMeters",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Size matches",
        details: `${propertySqm} sqm is within ${minSqm || 0}-${
          maxSqm || "∞"
        } sqm range`,
        hasPreference: true,
      };
    }

    // Close match (within 15%)
    if (minSqm && propertySqm < minSqm) {
      const underBy = ((minSqm - propertySqm) / minSqm) * 100;
      if (underBy <= 15) {
        return {
          category: "squareMeters",
          match: false,
          score: Math.round(maxScore * 0.6),
          maxScore,
          reason: "Slightly smaller",
          details: `${propertySqm} sqm is ${underBy.toFixed(
            0,
          )}% smaller than preferred`,
          hasPreference: true,
        };
      }
    }

    return {
      category: "squareMeters",
      match: false,
      score: 0,
      maxScore,
      reason: "Size doesn't match",
      details: `${propertySqm} sqm is outside your preference`,
      hasPreference: true,
    };
  }

  /**
   * 10. Bills matching
   */
  private matchBills(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const prefBills = preferences.bills;
    const propertyBills = property.bills?.toLowerCase();

    // No preference set - exclude from calculation
    if (!prefBills) {
      return {
        category: "bills",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No bills preference",
        details: `Bills: ${propertyBills || "Not specified"}`,
        hasPreference: false,
      };
    }

    // Exact match
    if (prefBills.toLowerCase() === propertyBills) {
      return {
        category: "bills",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Bills preference matches",
        details: `Bills ${propertyBills}`,
        hasPreference: true,
      };
    }

    // Partial match: user wants included, property has some included
    if (
      prefBills.toLowerCase() === "included" &&
      propertyBills === "some_included"
    ) {
      return {
        category: "bills",
        match: false,
        score: Math.round(maxScore * 0.6),
        maxScore,
        reason: "Some bills included",
        details: "Some bills are included, not all",
        hasPreference: true,
      };
    }

    return {
      category: "bills",
      match: false,
      score: 0,
      maxScore,
      reason: "Bills preference doesn't match",
      details: `Bills ${propertyBills || "excluded"}, you prefer ${prefBills}`,
      hasPreference: true,
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
    const wantsOutdoor = preferences.outdoor_space === true;
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

    // Add outdoor space preferences to scoring
    if (hasOutdoorPrefs) {
      const outdoorFeatures = [];
      if (wantsOutdoor) {
        totalRequested++;
        if (property.outdoor_space) {
          matchedCount++;
          outdoorFeatures.push("outdoor space");
        }
      }
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
    const details = [];
    if (matchedCount > 0) {
      details.push(`${matchedCount} of ${totalRequested} features available`);
    }
    if (property.outdoor_space) details.push("outdoor space");
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
   * Lifestyle compatibility matching (NEW)
   * Matches occupation, family_status with property tenant_types and characteristics
   */
  private matchLifestyle(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const occupation = preferences.occupation;
    const familyStatus = preferences.family_status;
    const childrenCount = preferences.children_count;
    const propertyTenantTypes = property.tenant_types || [];

    const hasLifestylePrefs = occupation || familyStatus || childrenCount;

    // No preference set - exclude from calculation
    if (!hasLifestylePrefs) {
      return {
        category: "lifestyle",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No lifestyle preferences",
        details: propertyTenantTypes.length
          ? `Accepts: ${propertyTenantTypes.join(", ")}`
          : "All tenant types accepted",
        hasPreference: false,
      };
    }

    // Property accepts all types
    if (!propertyTenantTypes.length) {
      return {
        category: "lifestyle",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Property accepts all lifestyles",
        details: "No tenant type restrictions",
        hasPreference: true,
      };
    }

    // Map lifestyle preferences to tenant types
    const normalizedTenantTypes = propertyTenantTypes.map((t) =>
      t.toLowerCase(),
    );
    let matchScore = 0;
    let totalChecks = 0;
    const matchDetails: string[] = [];

    // Check occupation compatibility
    if (occupation) {
      totalChecks++;
      const occupationMap: { [key: string]: string[] } = {
        student: ["student"],
        "young-professional": ["corporateLets", "sharers"],
        "freelancer-remote-worker": ["corporateLets", "sharers"],
        "business-owner": ["corporateLets"],
        "family-professional": ["family", "corporateLets"],
        other: ["corporateLets", "sharers"],
      };

      const matchingTypes = occupationMap[occupation] || [];
      const occupationMatches = matchingTypes.some((type) =>
        normalizedTenantTypes.includes(type.toLowerCase()),
      );

      if (occupationMatches) {
        matchScore++;
        matchDetails.push("Occupation compatible");
      }
    }

    // Check family status compatibility
    if (familyStatus) {
      totalChecks++;
      const familyMap: { [key: string]: string[] } = {
        "just-me": ["corporateLets", "sharers", "student"],
        couple: ["corporateLets", "sharers"],
        "couple-with-children": ["family"],
        "single-parent": ["family"],
        "friends-flatmates": ["sharers"],
      };

      const matchingTypes = familyMap[familyStatus] || [];
      const familyMatches = matchingTypes.some((type) =>
        normalizedTenantTypes.includes(type.toLowerCase()),
      );

      if (familyMatches) {
        matchScore++;
        matchDetails.push("Family status compatible");
      }
    }

    // Check children compatibility
    if (childrenCount && childrenCount !== "no") {
      totalChecks++;
      const hasFamily = normalizedTenantTypes.some((t) =>
        ["family", "elder"].includes(t),
      );

      if (hasFamily) {
        matchScore++;
        matchDetails.push("Children welcome");
      }
    }

    const matchRatio = totalChecks > 0 ? matchScore / totalChecks : 0;

    if (matchRatio === 1) {
      return {
        category: "lifestyle",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Perfect lifestyle match",
        details: matchDetails.join(", "),
        hasPreference: true,
      };
    }

    if (matchRatio >= 0.5) {
      return {
        category: "lifestyle",
        match: true,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Good lifestyle compatibility",
        details:
          matchDetails.length > 0
            ? matchDetails.join(", ")
            : "Some criteria match",
        hasPreference: true,
      };
    }

    if (matchRatio > 0) {
      return {
        category: "lifestyle",
        match: false,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Partial lifestyle compatibility",
        details:
          matchDetails.length > 0
            ? matchDetails.join(", ")
            : "Limited compatibility",
        hasPreference: true,
      };
    }

    return {
      category: "lifestyle",
      match: false,
      score: 0,
      maxScore,
      reason: "Lifestyle not compatible",
      details: `Property accepts: ${propertyTenantTypes.join(", ")}`,
      hasPreference: true,
    };
  }

  /**
   * Smoking compatibility matching (NEW)
   * Matches user's smoking preference with property smoking_area availability
   */
  private matchSmoking(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const smokerPref = preferences.smoker;
    const propertySmoking = property.smoking_area;

    // No preference set - exclude from calculation
    if (!smokerPref || smokerPref === "no-preference") {
      return {
        category: "smoking",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No smoking preference",
        details: propertySmoking
          ? "Smoking area available"
          : "No smoking area",
        hasPreference: false,
      };
    }

    // User is a smoker
    if (smokerPref === "yes") {
      if (propertySmoking) {
        return {
          category: "smoking",
          match: true,
          score: maxScore,
          maxScore,
          reason: "Smoking area available",
          details: "Property has designated smoking area",
          hasPreference: true,
        };
      }
      return {
        category: "smoking",
        match: false,
        score: 0,
        maxScore,
        reason: "No smoking area",
        details: "Property does not have smoking area",
        hasPreference: true,
      };
    }

    // User is non-smoker but okay with smoking area
    if (smokerPref === "no-but-okay") {
      return {
        category: "smoking",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Smoking policy acceptable",
        details: propertySmoking
          ? "Smoking area present but acceptable"
          : "No smoking area",
        hasPreference: true,
      };
    }

    // User prefers non-smoking environment
    if (smokerPref === "no" || smokerPref === "no-prefer-non-smoking") {
      if (!propertySmoking) {
        return {
          category: "smoking",
          match: true,
          score: maxScore,
          maxScore,
          reason: "Non-smoking environment",
          details: "Property has no smoking area (as preferred)",
          hasPreference: true,
        };
      }
      return {
        category: "smoking",
        match: false,
        score: Math.round(maxScore * 0.3),
        maxScore,
        reason: "Smoking area present",
        details: "Property has smoking area (not preferred)",
        hasPreference: true,
      };
    }

    return {
      category: "smoking",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Smoking policy acceptable",
      details: "No strong smoking preference",
      hasPreference: true,
    };
  }

  private getOutdoorSpaceDetails(property: Property): string {
    const features = [];
    if (property.outdoor_space) features.push("Outdoor space");
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
