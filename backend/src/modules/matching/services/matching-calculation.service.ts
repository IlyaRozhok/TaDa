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
      this.matchOccupation(property, preferences, weights.occupation),
    );

    // 9. Family status compatibility matching (ENHANCED)
    categories.push(
      this.matchFamilyStatus(property, preferences, weights.familyStatus),
    );

    // 10. Children compatibility matching (ENHANCED)
    categories.push(
      this.matchChildren(property, preferences, weights.children),
    );

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
    categories.push(
      this.matchSmoking(property, preferences, weights.smoking),
    );

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

  /**
   * Occupation compatibility matching (ENHANCED)
   * Matches user's occupation with property tenant types
   */
  private matchOccupation(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const occupation = preferences.occupation;
    const propertyTenantTypes = property.tenant_types || [];

    // No preference set - exclude from calculation
    if (!occupation) {
      return {
        category: "occupation",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No occupation preference",
        details: propertyTenantTypes.length
          ? `Property accepts: ${propertyTenantTypes.join(", ")}`
          : "All occupations accepted",
        hasPreference: false,
      };
    }

    // Property accepts all types
    if (!propertyTenantTypes.length) {
      return {
        category: "occupation",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Property accepts all occupations",
        details: "No tenant type restrictions",
        hasPreference: true,
      };
    }

    // Enhanced occupation mapping with more nuanced scoring
    const normalizedTenantTypes = propertyTenantTypes.map((t) => t.toLowerCase());
    const occupationMap: { [key: string]: { primary: string[], secondary?: string[], score?: number } } = {
      student: { 
        primary: ["student"], 
        secondary: ["sharers"], 
        score: 1.0 
      },
      "young-professional": { 
        primary: ["corporateLets", "sharers"], 
        secondary: ["student"], 
        score: 1.0 
      },
      "freelancer-remote-worker": { 
        primary: ["corporateLets", "sharers"], 
        secondary: ["student"], 
        score: 1.0 
      },
      "business-owner": { 
        primary: ["corporateLets"], 
        secondary: ["sharers"], 
        score: 1.0 
      },
      "family-professional": { 
        primary: ["family", "corporateLets"], 
        secondary: ["sharers"], 
        score: 1.0 
      },
      other: { 
        primary: ["corporateLets", "sharers"], 
        secondary: ["student"], 
        score: 1.0 
      },
    };

    const occupationConfig = occupationMap[occupation];
    if (!occupationConfig) {
      return {
        category: "occupation",
        match: false,
        score: 0,
        maxScore,
        reason: "Unknown occupation type",
        details: `Occupation: ${occupation}`,
        hasPreference: true,
      };
    }

    // Check primary matches (perfect compatibility)
    const primaryMatch = occupationConfig.primary.some((type) =>
      normalizedTenantTypes.includes(type.toLowerCase()),
    );

    if (primaryMatch) {
      return {
        category: "occupation",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Perfect occupation match",
        details: `${occupation} is ideal for this property type`,
        hasPreference: true,
      };
    }

    // Check secondary matches (good compatibility)
    if (occupationConfig.secondary) {
      const secondaryMatch = occupationConfig.secondary.some((type) =>
        normalizedTenantTypes.includes(type.toLowerCase()),
      );

      if (secondaryMatch) {
        return {
          category: "occupation",
          match: true,
          score: Math.round(maxScore * 0.7),
          maxScore,
          reason: "Good occupation compatibility",
          details: `${occupation} can work well with this property`,
          hasPreference: true,
        };
      }
    }

    return {
      category: "occupation",
      match: false,
      score: 0,
      maxScore,
      reason: "Occupation not compatible",
      details: `${occupation} doesn't match property tenant types: ${propertyTenantTypes.join(", ")}`,
      hasPreference: true,
    };
  }

  /**
   * Family status compatibility matching (ENHANCED)
   * Matches user's family situation with property tenant types
   */
  private matchFamilyStatus(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const familyStatus = preferences.family_status;
    const propertyTenantTypes = property.tenant_types || [];

    // No preference set - exclude from calculation
    if (!familyStatus) {
      return {
        category: "familyStatus",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No family status preference",
        details: propertyTenantTypes.length
          ? `Property accepts: ${propertyTenantTypes.join(", ")}`
          : "All family situations accepted",
        hasPreference: false,
      };
    }

    // Property accepts all types
    if (!propertyTenantTypes.length) {
      return {
        category: "familyStatus",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Property accepts all family situations",
        details: "No family restrictions",
        hasPreference: true,
      };
    }

    // Enhanced family status mapping with priority scoring
    const normalizedTenantTypes = propertyTenantTypes.map((t) => t.toLowerCase());
    const familyMap: { [key: string]: { primary: string[], secondary?: string[] } } = {
      "just-me": { 
        primary: ["corporateLets", "sharers"], 
        secondary: ["student"] 
      },
      couple: { 
        primary: ["corporateLets", "sharers"], 
        secondary: ["family"] 
      },
      "couple-with-children": { 
        primary: ["family"], 
        secondary: ["corporateLets"] 
      },
      "single-parent": { 
        primary: ["family"], 
        secondary: [] 
      },
      "friends-flatmates": { 
        primary: ["sharers"], 
        secondary: ["corporateLets", "student"] 
      },
    };

    const familyConfig = familyMap[familyStatus];
    if (!familyConfig) {
      return {
        category: "familyStatus",
        match: false,
        score: 0,
        maxScore,
        reason: "Unknown family status",
        details: `Family status: ${familyStatus}`,
        hasPreference: true,
      };
    }

    // Check primary matches (ideal compatibility)
    const primaryMatch = familyConfig.primary.some((type) =>
      normalizedTenantTypes.includes(type.toLowerCase()),
    );

    if (primaryMatch) {
      return {
        category: "familyStatus",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Perfect family status match",
        details: `Property is ideal for ${familyStatus.replace("-", " ")}`,
        hasPreference: true,
      };
    }

    // Check secondary matches (acceptable compatibility)
    if (familyConfig.secondary && familyConfig.secondary.length > 0) {
      const secondaryMatch = familyConfig.secondary.some((type) =>
        normalizedTenantTypes.includes(type.toLowerCase()),
      );

      if (secondaryMatch) {
        return {
          category: "familyStatus",
          match: true,
          score: Math.round(maxScore * 0.6),
          maxScore,
          reason: "Acceptable family compatibility",
          details: `Property can accommodate ${familyStatus.replace("-", " ")}`,
          hasPreference: true,
        };
      }
    }

    return {
      category: "familyStatus",
      match: false,
      score: 0,
      maxScore,
      reason: "Family status not compatible",
      details: `${familyStatus.replace("-", " ")} doesn't match property types: ${propertyTenantTypes.join(", ")}`,
      hasPreference: true,
    };
  }

  /**
   * Children compatibility matching (ENHANCED)
   * Matches user's children situation with property family-friendliness
   */
  private matchChildren(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const childrenCount = preferences.children_count;
    const propertyTenantTypes = property.tenant_types || [];
    const propertyChildren = property.children || [];

    // No preference set - exclude from calculation
    if (!childrenCount) {
      return {
        category: "children",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No children preference specified",
        details: propertyTenantTypes.length
          ? `Property accepts: ${propertyTenantTypes.join(", ")}`
          : "Children policy not specified",
        hasPreference: false,
      };
    }

    // User has no children
    if (childrenCount === "no") {
      return {
        category: "children",
        match: true,
        score: maxScore,
        maxScore,
        reason: "No children - compatible with all properties",
        details: "No children restrictions apply",
        hasPreference: true,
      };
    }

    // Property accepts all types
    if (!propertyTenantTypes.length) {
      return {
        category: "children",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Property accepts families with children",
        details: "No family restrictions",
        hasPreference: true,
      };
    }

    // Check if property is family-friendly
    const normalizedTenantTypes = propertyTenantTypes.map((t) => t.toLowerCase());
    const isFamilyFriendly = normalizedTenantTypes.some((t) =>
      ["family", "elder"].includes(t),
    );

    if (!isFamilyFriendly) {
      return {
        category: "children",
        match: false,
        score: 0,
        maxScore,
        reason: "Property not suitable for children",
        details: `Property types (${propertyTenantTypes.join(", ")}) don't typically accept children`,
        hasPreference: true,
      };
    }

    // Enhanced children matching based on property's children acceptance
    const userChildrenNum = this.parseChildrenCount(childrenCount);
    
    // Check if property explicitly accepts children
    if (propertyChildren.length === 0) {
      // Family-friendly but no specific children policy - assume acceptable
      return {
        category: "children",
        match: true,
        score: Math.round(maxScore * 0.7),
        maxScore,
        reason: "Family-friendly property",
        details: "Property accepts families (children policy not specified)",
        hasPreference: true,
      };
    }

    // Check if property explicitly says no children
    if (propertyChildren.includes("no")) {
      return {
        category: "children",
        match: false,
        score: 0,
        maxScore,
        reason: "Property doesn't accept children",
        details: "Property explicitly excludes children",
        hasPreference: true,
      };
    }

    // Find the maximum number of children the property accepts
    const propertyMaxChildren = Math.max(
      ...propertyChildren.map(c => this.parseChildrenCount(c))
    );

    // Perfect match - property specifically accommodates this number of children
    if (propertyChildren.includes(childrenCount as any)) {
      return {
        category: "children",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Perfect children count match",
        details: `Property specifically accepts ${childrenCount.replace("yes-", "").replace("-", " ")}`,
        hasPreference: true,
      };
    }

    // Good match - property can accommodate this number of children
    if (propertyMaxChildren >= userChildrenNum) {
      return {
        category: "children",
        match: true,
        score: Math.round(maxScore * 0.9),
        maxScore,
        reason: "Children count compatible",
        details: `Property can accommodate ${childrenCount.replace("yes-", "").replace("-", " ")}`,
        hasPreference: true,
      };
    }

    // Partial match - property has fewer children capacity than needed
    if (propertyMaxChildren > 0 && userChildrenNum > propertyMaxChildren) {
      return {
        category: "children",
        match: false,
        score: Math.round(maxScore * 0.3),
        maxScore,
        reason: "Limited children capacity",
        details: `Property accepts fewer children than you have`,
        hasPreference: true,
      };
    }

    return {
      category: "children",
      match: true,
      score: Math.round(maxScore * 0.8),
      maxScore,
      reason: "Children welcome",
      details: "Property is family-friendly",
      hasPreference: true,
    };
  }

  /**
   * Helper method to parse children count strings into numbers
   */
  private parseChildrenCount(childrenCount: string): number {
    if (!childrenCount || childrenCount === "no") return 0;
    if (childrenCount.includes("1-child")) return 1;
    if (childrenCount.includes("2-children")) return 2;
    if (childrenCount.includes("3-plus")) return 3;
    return 0;
  }

  /**
   * Smoking compatibility matching (NEW)
   * Matches user's smoking preference with property context (no dedicated smoking_area flag)
   */
  private matchSmoking(
    property: Property,
    preferences: Preferences,
    maxScore: number,
  ): CategoryMatchResult {
    const smokerPref = preferences.smoker;
    const propertySmoking = false;

    // No preference set - exclude from calculation
    if (!smokerPref || smokerPref === "no-preference") {
      return {
        category: "smoking",
        match: false,
        score: 0,
        maxScore: 0,
        reason: "No smoking preference",
        details: "Smoking policy not specified",
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
