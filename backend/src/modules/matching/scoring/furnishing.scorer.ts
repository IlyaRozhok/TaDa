import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Furnishing matching
 */
export function matchFurnishing(
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
