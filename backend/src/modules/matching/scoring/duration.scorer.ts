import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";
import { unknownPropertyData } from "./unknown-data";

/**
 * Duration matching
 */
export function matchDuration(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  const prefDurationRaw = preferences.let_duration;
  const propertyDuration = property.let_duration?.toLowerCase();

  // Support comma-separated multiselect (preferences and property)
  const prefDurations = prefDurationRaw
    ? prefDurationRaw.split(",").map((s) => s.trim().toLowerCase())
    : [];

  // No preference set - exclude from calculation
  if (prefDurations.length === 0) {
    return {
      category: "duration",
      match: false,
      score: 0,
      maxScore: 0,
      reason: "No duration preference",
      details: `Let duration: ${propertyDuration || "Flexible"}`,
      hasPreference: false,
    };
  }

  // A missing duration is NOT the same as "flexible": flexible is data the
  // operator entered and keeps its full match below; a blank field gets the
  // unknown-data policy (it used to score 100% — blank beat honest).
  if (!propertyDuration) {
    return unknownPropertyData(
      "duration",
      maxScore,
      "Let duration not specified",
    );
  }

  if (propertyDuration === "flexible") {
    return {
      category: "duration",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Flexible duration",
      details: "Property offers flexible let duration",
      hasPreference: true,
    };
  }

  // Property may be comma-separated (multiselect)
  const propertyDurations = propertyDuration
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // Match if any preference duration matches any property duration
  const prefSet = new Set(prefDurations);
  const hasExactMatch = propertyDurations.some((pd) => prefSet.has(pd));
  if (hasExactMatch) {
    return {
      category: "duration",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Duration matches",
      details: `${propertyDuration} matches your preference`,
      hasPreference: true,
    };
  }

  // Partial match for similar durations (short/long term variants)
  const shortTermVariants = [
    "short_term",
    "short-term",
    "6_months",
    "6-months",
  ];
  const longTermVariants = [
    "long_term",
    "long-term",
    "medium_term",
    "medium-term",
    "12_months",
    "12-months",
  ];

  const prefIsShort = prefDurations.some((p) =>
    shortTermVariants.includes(p),
  );
  const propIsShort = propertyDurations.some((p) =>
    shortTermVariants.includes(p),
  );
  const prefIsLong = prefDurations.some((p) => longTermVariants.includes(p));
  const propIsLong = propertyDurations.some((p) =>
    longTermVariants.includes(p),
  );

  if ((prefIsShort && propIsShort) || (prefIsLong && propIsLong)) {
    return {
      category: "duration",
      match: true,
      score: Math.round(maxScore * 0.8),
      maxScore,
      reason: "Similar duration",
      details: `${propertyDuration} is similar to your preference`,
      hasPreference: true,
    };
  }

  return {
    category: "duration",
    match: false,
    score: 0,
    maxScore,
    reason: "Duration doesn't match",
    details: `${propertyDuration}, you prefer ${prefDurations.join(", ")}`,
    hasPreference: true,
  };
}
