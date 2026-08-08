import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Family status compatibility matching (ENHANCED)
 * Matches user's family situation with property tenant types
 */
export function matchFamilyStatus(
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
