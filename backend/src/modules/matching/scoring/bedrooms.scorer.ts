import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";
import { UNKNOWN_DATA_CREDIT } from "./unknown-data";

/** One bedroom from the nearest selected count. */
const CLOSE_CREDIT = 0.4;
/** The wizard's "5+" is stored as 5, and means five or more. */
const OPEN_ENDED_FROM = 5;

/**
 * A studio has no separate bedroom whatever its count says: the property forms
 * only offer 1-5, so studios are stored as 1 or left empty. Scored as stored, a
 * studio was as close to a 2-bed search as a real 1-bed.
 */
function effectiveBedrooms(property: Property): number | null | undefined {
  return property.property_type?.trim().toLowerCase() === "studio"
    ? 0
    : property.bedrooms;
}

/** How far a count is from the nearest selected one (0 is a match). */
function bedroomDistance(bedrooms: number, selected: number[]): number {
  return Math.min(
    ...selected.map((count) =>
      count >= OPEN_ENDED_FROM && bedrooms >= OPEN_ENDED_FROM
        ? 0
        : Math.abs(bedrooms - count),
    ),
  );
}

/**
 * Bedrooms matching, by distance to the nearest selected count: exact 100%, one
 * away 40%, two or more 0. Weighted, never a filter, so a thin inventory still
 * shows something.
 */
export function matchBedrooms(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  const prefBedrooms = preferences.bedrooms || [];
  const propertyBedrooms = effectiveBedrooms(property);

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
      score: Math.round(maxScore * UNKNOWN_DATA_CREDIT),
      maxScore,
      reason: "Bedroom count unknown",
      details: "Property bedroom count not specified",
      hasPreference: true,
    };
  }

  const distance = bedroomDistance(propertyBedrooms, prefBedrooms);

  if (distance === 0) {
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

  if (distance === 1) {
    return {
      category: "bedrooms",
      match: false,
      score: Math.round(maxScore * CLOSE_CREDIT),
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
