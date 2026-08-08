import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Bedrooms matching
 */
export function matchBedrooms(
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
