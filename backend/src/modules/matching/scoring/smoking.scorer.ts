import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";
import { unknownPropertyData } from "./unknown-data";

/**
 * Smoking compatibility matching.
 *
 * The schema carries NO smoking data on properties. The old scorer papered
 * over that with `const propertySmoking = false` — inventing "this property
 * is non-smoking" for every listing, which gave every smoker a structural 0
 * and every non-smoker a free full score. B4 makes the category honest:
 * with no data to compare against, everyone with a firm preference gets the
 * unknown-data policy. "no-but-okay" keeps its full match — that tenant is
 * truthfully satisfied whatever the policy turns out to be.
 *
 * The `property` parameter stays in the signature for scorer uniformity and
 * for the day a real smoking-policy column exists.
 */
export function matchSmoking(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  const smokerPref = preferences.smoker;

  // No preference set - exclude from calculation
  if (!smokerPref || smokerPref === "no-preference") {
    return {
      category: "smoking",
      match: false,
      score: 0,
      maxScore: 0,
      reason: "No smoking preference",
      details: "Smoking policy not specified",
      hasPreference: false,
    };
  }

  // Indifferent either way — a full match regardless of missing data.
  if (smokerPref === "no-but-okay") {
    return {
      category: "smoking",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Smoking policy acceptable",
      details: "You are comfortable with either policy",
      hasPreference: true,
    };
  }

  // Firm preference (smoker, or wants a non-smoking environment) against a
  // schema with no smoking data: unknown-data policy.
  return unknownPropertyData(
    "smoking",
    maxScore,
    "Smoking policy not specified",
  );
}
