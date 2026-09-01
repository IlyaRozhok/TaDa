import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";
import { unknownPropertyData } from "./unknown-data";
import { splitPreferenceList } from "./preference-list";

/**
 * Family status compatibility matching.
 *
 * Signal order (B4): the property's own `family_status` targeting column is
 * authoritative and compares exactly (same value set on both sides); the
 * tenant-type heuristic is the fallback for rows without targeting; a row
 * with no data at all gets the unknown-data policy instead of the free 100%
 * it used to score.
 */
export function matchFamilyStatus(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  // Multi-select stored as a comma-joined string — compare any-of, never the
  // joined string (see occupation.scorer for the full story).
  const familyStatuses = splitPreferenceList(preferences.family_status);
  const familyStatus = familyStatuses[0];
  const propertyTenantTypes = property.tenant_types || [];

  // No preference set - exclude from calculation
  if (!familyStatus) {
    return {
      category: "familyStatus",
      match: false,
      score: 0,
      maxScore: 0,
      reason: "No family status preference",
      details: propertyTenantTypes.length
        ? `Property accepts: ${propertyTenantTypes.join(", ")}`
        : "All family situations accepted",
      hasPreference: false,
    };
  }

  // Direct targeting beats every heuristic.
  const propertyFamilyStatuses = (property.family_status || []).map(String);
  if (propertyFamilyStatuses.length > 0) {
    const targeted = familyStatuses.find((entry) =>
      propertyFamilyStatuses.includes(entry),
    );
    if (targeted) {
      return {
        category: "familyStatus",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Property targets your family situation",
        details: `${targeted.replace("-", " ")} is among the property's target family statuses`,
        hasPreference: true,
      };
    }
    return {
      category: "familyStatus",
      match: false,
      score: 0,
      maxScore,
      reason: "Property targets other family situations",
      details: `Targets: ${propertyFamilyStatuses.join(", ")}`,
      hasPreference: true,
    };
  }

  // No targeting data of any kind — unknown-data policy.
  if (!propertyTenantTypes.length) {
    return unknownPropertyData(
      "familyStatus",
      maxScore,
      "No tenant targeting on the property",
    );
  }

  // Enhanced family status mapping with priority scoring
  const normalizedTenantTypes = propertyTenantTypes.map((t) => t.toLowerCase());
  const familyMap: { [key: string]: { primary: string[], secondary?: string[] } } = {
    "just-me": {
      primary: ["corporateLets", "sharers"],
      secondary: ["student"]
    },
    couple: {
      primary: ["corporateLets", "sharers"],
      secondary: ["family"]
    },
    "couple-with-children": {
      primary: ["family"],
      secondary: ["corporateLets"]
    },
    "single-parent": {
      primary: ["family"],
      secondary: []
    },
    "friends-flatmates": {
      primary: ["sharers"],
      secondary: ["corporateLets", "student"]
    },
  };

  // Any-of over the selected statuses; unknown values are skipped, an
  // all-unknown selection reports as before.
  const knownConfigs = familyStatuses
    .map((entry) => ({ entry, config: familyMap[entry] }))
    .filter((item) => item.config);

  if (knownConfigs.length === 0) {
    return {
      category: "familyStatus",
      match: false,
      score: 0,
      maxScore,
      reason: "Unknown family status",
      details: `Family status: ${familyStatuses.join(", ")}`,
      hasPreference: true,
    };
  }

  // Check primary matches (ideal compatibility)
  const primaryHit = knownConfigs.find(({ config }) =>
    config.primary.some((type) => normalizedTenantTypes.includes(type.toLowerCase())),
  );

  if (primaryHit) {
    return {
      category: "familyStatus",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Perfect family status match",
      details: `Property is ideal for ${primaryHit.entry.replace("-", " ")}`,
      hasPreference: true,
    };
  }

  // Check secondary matches (acceptable compatibility)
  const secondaryHit = knownConfigs.find(({ config }) =>
    (config.secondary ?? []).some((type) =>
      normalizedTenantTypes.includes(type.toLowerCase()),
    ),
  );

  if (secondaryHit) {
    return {
      category: "familyStatus",
      match: true,
      score: Math.round(maxScore * 0.6),
      maxScore,
      reason: "Acceptable family compatibility",
      details: `Property can accommodate ${secondaryHit.entry.replace("-", " ")}`,
      hasPreference: true,
    };
  }

  return {
    category: "familyStatus",
    match: false,
    score: 0,
    maxScore,
    reason: "Family status not compatible",
    details: `${familyStatuses.map((s) => s.replace("-", " ")).join(", ")} doesn't match property types: ${propertyTenantTypes.join(", ")}`,
    hasPreference: true,
  };
}
