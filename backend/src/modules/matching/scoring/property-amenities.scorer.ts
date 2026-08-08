import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Property amenities matching
 * Matches apartment-level features (kitchen, bathroom, storage, tech, access)
 */
export function matchPropertyAmenities(
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
