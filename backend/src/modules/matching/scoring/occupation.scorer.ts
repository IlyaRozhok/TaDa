import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";
import { unknownPropertyData } from "./unknown-data";
import { splitPreferenceList } from "./preference-list";

/**
 * Occupation compatibility matching.
 *
 * Signal order (B4): the property's own `occupation` targeting column is
 * authoritative — operators fill it with the SAME value set the preference
 * uses, so it compares exactly. Until B4 the column was never read: the
 * scorer ran a hard-coded lifestyle heuristic over `tenant_types` instead,
 * so targeting a building at an occupation had zero effect on scores. The
 * heuristic remains only as the fallback for rows with tenant types but no
 * occupation targeting; a row with neither gets the unknown-data policy
 * (it used to score a free 100%).
 */
export function matchOccupation(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  // The wizard collects occupation as a MULTI-select and stores it as a
  // comma-joined string ("student,young-professional"). Every comparison
  // below is any-of over the selected values — treating the joined string as
  // one value scored 0 with "Unknown occupation type" for exactly the
  // tenants who answered most thoroughly.
  const occupations = splitPreferenceList(preferences.occupation);
  const occupation = occupations[0];
  const propertyTenantTypes = property.tenant_types || [];

  // No preference set - exclude from calculation
  if (!occupation) {
    return {
      category: "occupation",
      match: false,
      score: 0,
      maxScore: 0,
      reason: "No occupation preference",
      details: propertyTenantTypes.length
        ? `Property accepts: ${propertyTenantTypes.join(", ")}`
        : "All occupations accepted",
      hasPreference: false,
    };
  }

  // Direct targeting beats every heuristic.
  const propertyOccupations = (property.occupation || []).map(String);
  if (propertyOccupations.length > 0) {
    const targeted = occupations.find((entry) =>
      propertyOccupations.includes(entry),
    );
    if (targeted) {
      return {
        category: "occupation",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Property targets your occupation",
        details: `${targeted} is among the property's target occupations`,
        hasPreference: true,
      };
    }
    return {
      category: "occupation",
      match: false,
      score: 0,
      maxScore,
      reason: "Property targets other occupations",
      details: `Targets: ${propertyOccupations.join(", ")}`,
      hasPreference: true,
    };
  }

  // No targeting data of any kind — unknown-data policy.
  if (!propertyTenantTypes.length) {
    return unknownPropertyData(
      "occupation",
      maxScore,
      "No tenant targeting on the property",
    );
  }

  // Enhanced occupation mapping with more nuanced scoring
  const normalizedTenantTypes = propertyTenantTypes.map((t) => t.toLowerCase());
  const occupationMap: { [key: string]: { primary: string[], secondary?: string[], score?: number } } = {
    student: {
      primary: ["student"],
      secondary: ["sharers"],
      score: 1.0
    },
    "young-professional": {
      primary: ["corporateLets", "sharers"],
      secondary: ["student"],
      score: 1.0
    },
    "freelancer-remote-worker": {
      primary: ["corporateLets", "sharers"],
      secondary: ["student"],
      score: 1.0
    },
    "business-owner": {
      primary: ["corporateLets"],
      secondary: ["sharers"],
      score: 1.0
    },
    "family-professional": {
      primary: ["family", "corporateLets"],
      secondary: ["sharers"],
      score: 1.0
    },
    other: {
      primary: ["corporateLets", "sharers"],
      secondary: ["student"],
      score: 1.0
    },
  };

  // Any-of over the selected occupations: the best tier any of them reaches
  // is the tenant's score. A value the map does not know is skipped rather
  // than sinking the whole category; only an all-unknown selection reports
  // "Unknown occupation type".
  const knownConfigs = occupations
    .map((entry) => ({ entry, config: occupationMap[entry] }))
    .filter((item) => item.config);

  if (knownConfigs.length === 0) {
    return {
      category: "occupation",
      match: false,
      score: 0,
      maxScore,
      reason: "Unknown occupation type",
      details: `Occupation: ${occupations.join(", ")}`,
      hasPreference: true,
    };
  }

  // Check primary matches (perfect compatibility)
  const primaryHit = knownConfigs.find(({ config }) =>
    config.primary.some((type) => normalizedTenantTypes.includes(type.toLowerCase())),
  );

  if (primaryHit) {
    return {
      category: "occupation",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Perfect occupation match",
      details: `${primaryHit.entry} is ideal for this property type`,
      hasPreference: true,
    };
  }

  // Check secondary matches (good compatibility)
  const secondaryHit = knownConfigs.find(({ config }) =>
    (config.secondary ?? []).some((type) =>
      normalizedTenantTypes.includes(type.toLowerCase()),
    ),
  );

  if (secondaryHit) {
    return {
      category: "occupation",
      match: true,
      score: Math.round(maxScore * 0.7),
      maxScore,
      reason: "Good occupation compatibility",
      details: `${secondaryHit.entry} can work well with this property`,
      hasPreference: true,
    };
  }

  return {
    category: "occupation",
    match: false,
    score: 0,
    maxScore,
    reason: "Occupation not compatible",
    details: `${occupations.join(", ")} doesn't match property tenant types: ${propertyTenantTypes.join(", ")}`,
    hasPreference: true,
  };
}
