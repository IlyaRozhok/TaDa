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
    weights: CategoryWeights = DEFAULT_WEIGHTS
  ): PropertyMatchResult {
    const categories: CategoryMatchResult[] = [];

    // 1. Budget matching
    categories.push(this.matchBudget(property, preferences, weights.budget));

    // 2. Availability/Dates matching
    categories.push(
      this.matchAvailability(property, preferences, weights.availability)
    );

    // 3. Deposit matching
    categories.push(this.matchDeposit(property, preferences, weights.deposit));

    // 4. Property type matching
    categories.push(
      this.matchPropertyType(property, preferences, weights.propertyType)
    );

    // 5. Bedrooms matching
    categories.push(
      this.matchBedrooms(property, preferences, weights.bedrooms)
    );

    // 6. Bathrooms matching
    categories.push(
      this.matchBathrooms(property, preferences, weights.bathrooms)
    );

    // 7. Building style matching
    categories.push(
      this.matchBuildingStyle(property, preferences, weights.buildingStyle)
    );

    // 8. Duration matching
    categories.push(
      this.matchDuration(property, preferences, weights.duration)
    );

    // 9. Square meters matching
    categories.push(
      this.matchSquareMeters(property, preferences, weights.squareMeters)
    );

    // 10. Bills matching
    categories.push(this.matchBills(property, preferences, weights.bills));

    // 11. Tenant type matching
    categories.push(
      this.matchTenantType(property, preferences, weights.tenantType)
    );

    // 12. Pets matching
    categories.push(this.matchPets(property, preferences, weights.pets));

    // 13. Amenities matching
    categories.push(
      this.matchAmenities(property, preferences, weights.amenities)
    );

    // 14. Outdoor space matching
    categories.push(
      this.matchOutdoorSpace(property, preferences, weights.outdoorSpace)
    );

    // 15. Furnishing matching
    categories.push(
      this.matchFurnishing(property, preferences, weights.furnishing)
    );

    // 16. Location matching
    categories.push(
      this.matchLocation(property, preferences, weights.location)
    );

    // Calculate totals - ONLY include categories where user has set a preference
    // Categories without preferences are excluded from the calculation
    const categoriesWithPreference = categories.filter((c) => c.hasPreference);

    const totalScore = categoriesWithPreference.reduce(
      (sum, cat) => sum + cat.score,
      0
    );
    const maxPossibleScore = categoriesWithPreference.reduce(
      (sum, cat) => sum + cat.maxScore,
      0
    );

    // If no preferences set at all, matchPercentage = 0
    const matchPercentage =
      maxPossibleScore > 0
        ? Math.round((totalScore / maxPossibleScore) * 100)
        : 0;

    // Count category matches (only from categories with preferences)
    const matched = categoriesWithPreference.filter(
      (c) => c.match && c.score === c.maxScore
    ).length;
    const partial = categoriesWithPreference.filter(
      (c) => c.score > 0 && c.score < c.maxScore
    ).length;
    const notMatched = categoriesWithPreference.filter(
      (c) => c.score === 0 && c.maxScore > 0
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
    maxScore: number
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
            1
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
            1
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
    maxScore: number
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
      (available.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24)
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
   * 3. Deposit matching
   */
  private matchDeposit(
    property: Property,
    preferences: Preferences,
    maxScore: number
  ): CategoryMatchResult {
    const depositPref = preferences.deposit_preference;
    const propertyDeposit = Number(property.deposit) || 0;

    // No preference set - exclude from calculation
    if (!depositPref) {
      return {
        category: "deposit",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No deposit preference",
        details: propertyDeposit
          ? `Deposit: £${propertyDeposit}`
          : "No deposit required",
        hasPreference: false,
      };
    }

    // User doesn't want deposit
    if (depositPref === "no") {
      if (propertyDeposit === 0) {
        return {
          category: "deposit",
          match: true,
          score: maxScore,
          maxScore,
          reason: "No deposit required",
          details: "Property has no deposit requirement",
          hasPreference: true,
        };
      }
      return {
        category: "deposit",
        match: false,
        score: 0,
        maxScore,
        reason: "Deposit required",
        details: `Property requires £${propertyDeposit} deposit`,
        hasPreference: true,
      };
    }

    // User accepts deposit
    return {
      category: "deposit",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Deposit acceptable",
      details: propertyDeposit
        ? `Deposit: £${propertyDeposit}`
        : "No deposit required",
      hasPreference: true,
    };
  }

  /**
   * 4. Property type matching
   */
  private matchPropertyType(
    property: Property,
    preferences: Preferences,
    maxScore: number
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
    maxScore: number
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
          ", "
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
        ", "
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
    maxScore: number
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
        ", "
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
    maxScore: number
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
    maxScore: number
  ): CategoryMatchResult {
    const prefDuration = preferences.let_duration;
    const propertyDuration = property.let_duration?.toLowerCase();

    // No preference set - exclude from calculation
    if (!prefDuration) {
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

    // Exact match
    if (prefDuration.toLowerCase() === propertyDuration) {
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

    // Partial match for similar durations
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

    const prefIsShort = shortTermVariants.includes(prefDuration.toLowerCase());
    const propIsShort = shortTermVariants.includes(propertyDuration);
    const prefIsLong = longTermVariants.includes(prefDuration.toLowerCase());
    const propIsLong = longTermVariants.includes(propertyDuration);

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
      details: `${propertyDuration}, you prefer ${prefDuration}`,
      hasPreference: true,
    };
  }

  /**
   * 9. Square meters matching
   */
  private matchSquareMeters(
    property: Property,
    preferences: Preferences,
    maxScore: number
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
            0
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
    maxScore: number
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
   * 11. Tenant type matching
   */
  private matchTenantType(
    property: Property,
    preferences: Preferences,
    maxScore: number
  ): CategoryMatchResult {
    const prefTypes = preferences.tenant_types || [];
    const propertyTypes = property.tenant_types || [];

    // No preference set - exclude from calculation
    if (!prefTypes.length) {
      return {
        category: "tenantType",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No tenant type preference",
        details: `Accepts: ${
          propertyTypes.length ? propertyTypes.join(", ") : "All"
        }`,
        hasPreference: false,
      };
    }

    // Property accepts all types
    if (!propertyTypes.length) {
      return {
        category: "tenantType",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Property accepts all tenant types",
        details: "No tenant type restrictions",
        hasPreference: true,
      };
    }

    // Check for overlap
    const normalizedPrefTypes = prefTypes.map((t) => t.toLowerCase());
    const normalizedPropTypes = propertyTypes.map((t) => t.toLowerCase());
    const overlap = normalizedPrefTypes.filter((t) =>
      normalizedPropTypes.includes(t)
    );

    if (overlap.length > 0) {
      const matchRatio = overlap.length / prefTypes.length;
      return {
        category: "tenantType",
        match: true,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Tenant type compatible",
        details: `Matches: ${overlap.join(", ")}`,
        hasPreference: true,
      };
    }

    return {
      category: "tenantType",
      match: false,
      score: 0,
      maxScore,
      reason: "Tenant type not accepted",
      details: `Property accepts: ${propertyTypes.join(", ")}`,
      hasPreference: true,
    };
  }

  /**
   * 12. Pets matching
   */
  private matchPets(
    property: Property,
    preferences: Preferences,
    maxScore: number
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
            allowedPetTypes.includes(type) || allowedPetTypes.includes("all")
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
            allowedPetTypes.includes(type) || allowedPetTypes.includes("all")
        );

        if (matchedPets.length > 0) {
          return {
            category: "pets",
            match: false,
            score: Math.round(
              maxScore * (matchedPets.length / userPetTypes.length)
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
   * 13. Amenities matching
   */
  private matchAmenities(
    property: Property,
    preferences: Preferences,
    maxScore: number
  ): CategoryMatchResult {
    const prefAmenities = preferences.amenities || [];
    const propertyAmenities = property.amenities || [];

    // No preference set - exclude from calculation
    if (!prefAmenities.length) {
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

    // Normalize for comparison
    const normalizedPref = prefAmenities.map((a) => a.toLowerCase());
    const normalizedProp = propertyAmenities.map((a) => a.toLowerCase());

    // Find matches
    const matched = normalizedPref.filter((a) => normalizedProp.includes(a));
    const matchRatio = matched.length / prefAmenities.length;

    if (matchRatio === 1) {
      return {
        category: "amenities",
        match: true,
        score: maxScore,
        maxScore,
        reason: "All amenities available",
        details: `Has all ${prefAmenities.length} preferred amenities`,
        hasPreference: true,
      };
    }

    if (matchRatio >= 0.5) {
      return {
        category: "amenities",
        match: true,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Most amenities available",
        details: `Has ${matched.length} of ${prefAmenities.length} preferred amenities`,
        hasPreference: true,
      };
    }

    if (matched.length > 0) {
      return {
        category: "amenities",
        match: false,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Some amenities available",
        details: `Has ${matched.length} of ${prefAmenities.length} preferred amenities`,
        hasPreference: true,
      };
    }

    return {
      category: "amenities",
      match: false,
      score: 0,
      maxScore,
      reason: "Preferred amenities not available",
      details: `Missing: ${prefAmenities.slice(0, 3).join(", ")}`,
      hasPreference: true,
    };
  }

  /**
   * 14. Outdoor space matching (outdoor_space, balcony, terrace)
   */
  private matchOutdoorSpace(
    property: Property,
    preferences: Preferences,
    maxScore: number
  ): CategoryMatchResult {
    const wantsOutdoor = preferences.outdoor_space === true;
    const wantsBalcony = preferences.balcony === true;
    const wantsTerrace = preferences.terrace === true;

    // No preference set - exclude from calculation
    if (!wantsOutdoor && !wantsBalcony && !wantsTerrace) {
      return {
        category: "outdoorSpace",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No outdoor space preference",
        details: this.getOutdoorSpaceDetails(property),
        hasPreference: false,
      };
    }

    const hasOutdoor = property.outdoor_space === true;
    const hasBalcony = property.balcony === true;
    const hasTerrace = property.terrace === true;

    let matchedFeatures = 0;
    let requestedFeatures = 0;

    if (wantsOutdoor) {
      requestedFeatures++;
      if (hasOutdoor) matchedFeatures++;
    }
    if (wantsBalcony) {
      requestedFeatures++;
      if (hasBalcony) matchedFeatures++;
    }
    if (wantsTerrace) {
      requestedFeatures++;
      if (hasTerrace) matchedFeatures++;
    }

    const matchRatio =
      requestedFeatures > 0 ? matchedFeatures / requestedFeatures : 1;

    if (matchRatio === 1) {
      return {
        category: "outdoorSpace",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Outdoor space matches",
        details: this.getOutdoorSpaceDetails(property),
        hasPreference: true,
      };
    }

    if (matchRatio > 0) {
      return {
        category: "outdoorSpace",
        match: false,
        score: Math.round(maxScore * matchRatio),
        maxScore,
        reason: "Partial outdoor space match",
        details: this.getOutdoorSpaceDetails(property),
        hasPreference: true,
      };
    }

    return {
      category: "outdoorSpace",
      match: false,
      score: 0,
      maxScore,
      reason: "No outdoor space available",
      details: "Property has no outdoor space features",
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
    maxScore: number
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
   * 16. Location matching (metro stations, commute times)
   */
  private matchLocation(
    property: Property,
    preferences: Preferences,
    maxScore: number
  ): CategoryMatchResult {
    const prefMetro = preferences.preferred_metro_stations || [];
    const prefCommute = preferences.preferred_commute_times || [];
    const propertyMetro = property.metro_stations || [];
    const propertyCommute = property.commute_times || [];

    // No preference set - exclude from calculation
    if (!prefMetro.length && !prefCommute.length) {
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

    // Check metro station matches
    let metroMatch = false;
    if (prefMetro.length > 0 && propertyMetro.length > 0) {
      const propMetroLabels = propertyMetro.map((m) => m.label?.toLowerCase());
      const prefMetroNormalized = prefMetro.map((m) => m.toLowerCase());
      metroMatch = prefMetroNormalized.some((pm) =>
        propMetroLabels.some(
          (pml) => pml?.includes(pm) || pm.includes(pml || "")
        )
      );
    }

    if (metroMatch) {
      return {
        category: "location",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Near preferred metro",
        details: `Near: ${propertyMetro
          .slice(0, 2)
          .map((m) => m.label)
          .join(", ")}`,
        hasPreference: true,
      };
    }

    // If no metro match but property has good commute times
    if (propertyCommute.length > 0) {
      const avgCommute =
        propertyCommute.reduce((sum, c) => sum + (c.destination || 0), 0) /
        propertyCommute.length;
      if (avgCommute <= 30) {
        return {
          category: "location",
          match: true,
          score: Math.round(maxScore * 0.7),
          maxScore,
          reason: "Good commute times",
          details: `Average commute: ${Math.round(avgCommute)} minutes`,
          hasPreference: true,
        };
      }
    }

    return {
      category: "location",
      match: false,
      score: 0,
      maxScore,
      reason: "Location not ideal",
      details: "Not near preferred locations",
      hasPreference: true,
    };
  }
}
