import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Amenities matching - IMPROVED
 * Includes outdoor space features as part of amenities scoring
 */
export function matchAmenities(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  const prefAmenities = preferences.amenities || [];
  const propertyAmenities = property.amenities || [];

  // Check outdoor space preferences
  const wantsOutdoor = false;
  const wantsBalcony = preferences.balcony === true;
  const wantsTerrace = preferences.terrace === true;
  const hasOutdoorPrefs = wantsOutdoor || wantsBalcony || wantsTerrace;

  // No preference set - exclude from calculation
  if (!prefAmenities.length && !hasOutdoorPrefs) {
    return {
      category: "amenities",
      match: false,
      score: 0,
      maxScore: 0,
      reason: "No amenity preferences",
      details: propertyAmenities.length
        ? `Available: ${propertyAmenities.slice(0, 3).join(", ")}${
            propertyAmenities.length > 3 ? "..." : ""
          }`
        : "No amenities listed",
      hasPreference: false,
    };
  }

  let totalRequested = prefAmenities.length;
  let matchedCount = 0;

  // Match regular amenities
  if (prefAmenities.length > 0) {
    const normalizedPref = prefAmenities.map((a) => a.toLowerCase());
    const normalizedProp = propertyAmenities.map((a) => a.toLowerCase());
    const matched = normalizedPref.filter((a) => normalizedProp.includes(a));
    matchedCount += matched.length;
  }

  // Add outdoor space preferences to scoring (balcony/terrace only)
  if (hasOutdoorPrefs) {
    const outdoorFeatures: string[] = [];
    if (wantsBalcony) {
      totalRequested++;
      if (property.balcony) {
        matchedCount++;
        outdoorFeatures.push("balcony");
      }
    }
    if (wantsTerrace) {
      totalRequested++;
      if (property.terrace) {
        matchedCount++;
        outdoorFeatures.push("terrace");
      }
    }
  }

  const matchRatio = totalRequested > 0 ? matchedCount / totalRequested : 0;

  // Build details
  const details: string[] = [];
  if (matchedCount > 0) {
    details.push(`${matchedCount} of ${totalRequested} features available`);
  }
  if (property.balcony) details.push("balcony");
  if (property.terrace) details.push("terrace");

  if (matchRatio === 1) {
    return {
      category: "amenities",
      match: true,
      score: maxScore,
      maxScore,
      reason: "All amenities & features available",
      details: details.join(", "),
      hasPreference: true,
    };
  }

  if (matchRatio >= 0.6) {
    return {
      category: "amenities",
      match: true,
      score: Math.round(maxScore * matchRatio),
      maxScore,
      reason: "Most amenities & features available",
      details: details.length > 0 ? details.join(", ") : "Good match",
      hasPreference: true,
    };
  }

  if (matchRatio > 0) {
    return {
      category: "amenities",
      match: false,
      score: Math.round(maxScore * matchRatio),
      maxScore,
      reason: "Some amenities & features available",
      details: details.length > 0 ? details.join(", ") : "Partial match",
      hasPreference: true,
    };
  }

  return {
    category: "amenities",
    match: false,
    score: 0,
    maxScore,
    reason: "Preferred amenities & features not available",
    details: `Missing ${totalRequested} requested features`,
    hasPreference: true,
  };
}
