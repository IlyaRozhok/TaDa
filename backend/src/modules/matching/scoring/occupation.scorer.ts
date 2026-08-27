import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";
import { unknownPropertyData } from "./unknown-data";

/**
 * Occupation compatibility matching.
 *
 * Signal order (B4): the property's own `occupation` targeting column is
 * authoritative — operators fill it with the SAME value set the preference
 * uses, so it compares exactly. Until B4 the column was never read: the
 * scorer ran a hard-coded lifestyle heuristic over `tenant_types` instead,
 * so targeting a building at an occupation had zero effect on scores. The
 * heuristic remains only as the fallback for rows with tenant types but no
 * occupation targeting; a row with neither gets the unknown-data policy
 * (it used to score a free 100%).
 */
export function matchOccupation(
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

  // Direct targeting beats every heuristic.
  const propertyOccupations = (property.occupation || []).map(String);
  if (propertyOccupations.length > 0) {
    if (propertyOccupations.includes(occupation)) {
      return {
        category: "occupation",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Property targets your occupation",
        details: `${occupation} is among the property's target occupations`,
        hasPreference: true,
      };
    }
    return {
      category: "occupation",
      match: false,
      score: 0,
      maxScore,
      reason: "Property targets other occupations",
      details: `Targets: ${propertyOccupations.join(", ")}`,
      hasPreference: true,
    };
  }

  // No targeting data of any kind — unknown-data policy.
  if (!propertyTenantTypes.length) {
    return unknownPropertyData(
      "occupation",
      maxScore,
      "No tenant targeting on the property",
    );
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
