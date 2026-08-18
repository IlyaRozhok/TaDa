import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Bathrooms matching
 */
export function matchBathrooms(
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
