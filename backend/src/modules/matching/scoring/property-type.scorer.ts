import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";
import { unknownPropertyData } from "./unknown-data";

/**
 * Property type matching
 */
export function matchPropertyType(
  property: Property,
  preferences: Preferences,
  maxScore: number,
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

  // Unknown-data policy: a listing without a type is not a hard mismatch.
  if (!propertyType) {
    return unknownPropertyData(
      "propertyType",
      maxScore,
      "Property type not specified",
    );
  }

  // Check if property type matches any preference
  const normalizedPrefTypes = prefTypes.map((t) => t.toLowerCase());
  const matches = normalizedPrefTypes.includes(propertyType);

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
