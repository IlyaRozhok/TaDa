import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";
import { unknownPropertyData } from "./unknown-data";

/**
 * Availability matching: move_in_date vs property.available_from
 */
export function matchAvailability(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  const moveInDate = preferences.move_in_date;
  const availableFrom = property.available_from;

  // No preference set - exclude from calculation
  if (!moveInDate) {
    return {
      category: "availability",
      match: false,
      score: 0,
      maxScore: 0,
      reason: "No move-in date preference",
      details: availableFrom
        ? `Available from ${new Date(availableFrom).toLocaleDateString()}`
        : "Availability not specified",
      hasPreference: false,
    };
  }

  // Property has no availability date — unknown-data policy (this was 50%
  // with match: true, which counted a blank field as a half-confirmed match).
  if (!availableFrom) {
    return unknownPropertyData(
      "availability",
      maxScore,
      "Contact property for availability",
    );
  }

  const moveIn = new Date(moveInDate);
  const available = new Date(availableFrom);

  // Property available before or on move-in date
  if (available <= moveIn) {
    return {
      category: "availability",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Available on time",
      details: `Available from ${available.toLocaleDateString()}, move-in ${moveIn.toLocaleDateString()}`,
      hasPreference: true,
    };
  }

  // Property available after move-in date
  const daysDiff = Math.ceil(
    (available.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff <= 14) {
    // Within 2 weeks - partial match
    return {
      category: "availability",
      match: false,
      score: Math.round(maxScore * 0.7),
      maxScore,
      reason: "Available soon",
      details: `Available ${daysDiff} days after preferred move-in date`,
      hasPreference: true,
    };
  }

  if (daysDiff <= 30) {
    // Within 1 month - lower partial match
    return {
      category: "availability",
      match: false,
      score: Math.round(maxScore * 0.4),
      maxScore,
      reason: "Available within a month",
      details: `Available ${daysDiff} days after preferred move-in date`,
      hasPreference: true,
    };
  }

  return {
    category: "availability",
    match: false,
    score: 0,
    maxScore,
    reason: "Not available in time",
    details: `Available ${daysDiff} days after preferred move-in date`,
    hasPreference: true,
  };
}
