import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Square meters matching
 */
export function matchSquareMeters(
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
