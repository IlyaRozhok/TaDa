import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";
import { unknownPropertyData } from "./unknown-data";

/**
 * Bills matching
 */
export function matchBills(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  const prefBills = preferences.bills;
  const propertyBills = property.bills?.toLowerCase();

  // No preference set - exclude from calculation
  if (!prefBills) {
    return {
      category: "bills",
      match: false,
      score: 0,
      maxScore: 0,
      reason: "No bills preference",
      details: `Bills: ${propertyBills || "Not specified"}`,
      hasPreference: false,
    };
  }

  // Unknown-data policy: no bills value on the listing (the column default
  // is "excluded", so this is rare — but a genuine null must not read as a
  // hard mismatch).
  if (!propertyBills) {
    return unknownPropertyData("bills", maxScore, "Bills not specified");
  }

  // Exact match
  if (prefBills.toLowerCase() === propertyBills) {
    return {
      category: "bills",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Bills preference matches",
      details: `Bills ${propertyBills}`,
      hasPreference: true,
    };
  }

  // Partial match: user wants included, property has some included
  if (
    prefBills.toLowerCase() === "included" &&
    propertyBills === "some_included"
  ) {
    return {
      category: "bills",
      match: false,
      score: Math.round(maxScore * 0.6),
      maxScore,
      reason: "Some bills included",
      details: "Some bills are included, not all",
      hasPreference: true,
    };
  }

  return {
    category: "bills",
    match: false,
    score: 0,
    maxScore,
    reason: "Bills preference doesn't match",
    details: `Bills ${propertyBills || "excluded"}, you prefer ${prefBills}`,
    hasPreference: true,
  };
}
