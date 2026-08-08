import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Building style matching
 */
export function matchBuildingStyle(
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
