import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Location matching (areas, districts, metro stations) - IMPROVED
 * Checks multiple location criteria with weighted scoring
 *
 * UNREACHABLE by design, preserved as-is: `calculateMatch` pushes seventeen
 * categories and location is not one of them, exactly as before the 6.3
 * split. Wiring it in changes every score and is a product decision, not a
 * refactoring step. `CategoryWeights.location` and the `address` /
 * `metro_stations` columns in the ranking projection exist for the day it
 * is wired in.
 */
export function matchLocation(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  const prefAreas = preferences.preferred_areas || [];
  const prefDistricts = preferences.preferred_districts || [];
  const prefMetro = preferences.preferred_metro_stations || [];
  const propertyAddress = property.address?.toLowerCase() || "";
  const propertyMetro = property.metro_stations || [];

  const hasAnyPreference =
    prefAreas.length > 0 || prefDistricts.length > 0 || prefMetro.length > 0;

  // No preference set - exclude from calculation
  if (!hasAnyPreference) {
    return {
      category: "location",
      match: false,
      score: 0,
      maxScore: 0,
      reason: "No location preference",
      details: propertyMetro.length
        ? `Near: ${propertyMetro
            .slice(0, 2)
            .map((m) => m.label)
            .join(", ")}`
        : "Location info not available",
      hasPreference: false,
    };
  }

  let matchedCriteria = 0;
  let totalCriteria = 0;
  const matchDetails: string[] = [];

  // Check area matches (e.g., "West London", "Central")
  if (prefAreas.length > 0) {
    totalCriteria++;
    const normalizedPrefAreas = prefAreas.map((a) => a.toLowerCase());
    const areaMatch = normalizedPrefAreas.some(
      (area) =>
        propertyAddress.includes(area) ||
        propertyMetro.some((m) => m.label?.toLowerCase().includes(area)),
    );
    if (areaMatch) {
      matchedCriteria++;
      matchDetails.push("Area matches");
    }
  }

  // Check district/borough matches (e.g., "Camden", "Westminster")
  if (prefDistricts.length > 0) {
    totalCriteria++;
    const normalizedPrefDistricts = prefDistricts.map((d) => d.toLowerCase());
    const districtMatch = normalizedPrefDistricts.some(
      (district) =>
        propertyAddress.includes(district) ||
        propertyMetro.some((m) => m.label?.toLowerCase().includes(district)),
    );
    if (districtMatch) {
      matchedCriteria++;
      matchDetails.push("District matches");
    }
  }

  // Check metro station matches - most specific
  if (prefMetro.length > 0) {
    totalCriteria++;
    if (propertyMetro.length > 0) {
      const propMetroLabels = propertyMetro.map((m) =>
        m.label?.toLowerCase(),
      );
      const prefMetroNormalized = prefMetro.map((m) => m.toLowerCase());

      // Check for exact or partial metro matches
      const exactMatch = prefMetroNormalized.some((pm) =>
        propMetroLabels.some((pml) => pml === pm),
      );

      const partialMatch = prefMetroNormalized.some((pm) =>
        propMetroLabels.some(
          (pml) => pml?.includes(pm) || pm.includes(pml || ""),
        ),
      );

      if (exactMatch) {
        matchedCriteria += 1;
        matchDetails.push("Metro station matches exactly");
      } else if (partialMatch) {
        matchedCriteria += 0.7; // Partial credit for similar metro names
        matchDetails.push("Near preferred metro");
      }
    }
  }

  // Calculate match ratio
  const matchRatio = totalCriteria > 0 ? matchedCriteria / totalCriteria : 0;

  // Perfect match - all location criteria matched
  if (matchRatio === 1) {
    return {
      category: "location",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Perfect location match",
      details: matchDetails.join(", "),
      hasPreference: true,
    };
  }

  // Good match - most criteria matched
  if (matchRatio >= 0.6) {
    return {
      category: "location",
      match: true,
      score: Math.round(maxScore * matchRatio),
      maxScore,
      reason: "Good location match",
      details:
        matchDetails.length > 0
          ? matchDetails.join(", ")
          : `Near: ${propertyMetro
              .slice(0, 2)
              .map((m) => m.label)
              .join(", ")}`,
      hasPreference: true,
    };
  }

  // Partial match - some criteria matched
  if (matchRatio > 0) {
    return {
      category: "location",
      match: false,
      score: Math.round(maxScore * matchRatio),
      maxScore,
      reason: "Partial location match",
      details:
        matchDetails.length > 0
          ? matchDetails.join(", ")
          : "Some location criteria match",
      hasPreference: true,
    };
  }

  // No match
  return {
    category: "location",
    match: false,
    score: 0,
    maxScore,
    reason: "Location doesn't match",
    details: "Not in preferred areas or near preferred metro stations",
    hasPreference: true,
  };
}
