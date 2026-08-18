import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Smoking compatibility matching (NEW)
 * Matches user's smoking preference with property context (no dedicated smoking_area flag)
 */
export function matchSmoking(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  const smokerPref = preferences.smoker;
  const propertySmoking = false;

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

  // User is a smoker
  if (smokerPref === "yes") {
    if (propertySmoking) {
      return {
        category: "smoking",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Smoking area available",
        details: "Property has designated smoking area",
        hasPreference: true,
      };
    }
    return {
      category: "smoking",
      match: false,
      score: 0,
      maxScore,
      reason: "No smoking area",
      details: "Property does not have smoking area",
      hasPreference: true,
    };
  }

  // User is non-smoker but okay with smoking area
  if (smokerPref === "no-but-okay") {
    return {
      category: "smoking",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Smoking policy acceptable",
      details: propertySmoking
        ? "Smoking area present but acceptable"
        : "No smoking area",
      hasPreference: true,
    };
  }

  // User prefers non-smoking environment
  if (smokerPref === "no" || smokerPref === "no-prefer-non-smoking") {
    if (!propertySmoking) {
      return {
        category: "smoking",
        match: true,
        score: maxScore,
        maxScore,
        reason: "Non-smoking environment",
        details: "Property has no smoking area (as preferred)",
        hasPreference: true,
      };
    }
    return {
      category: "smoking",
      match: false,
      score: Math.round(maxScore * 0.3),
      maxScore,
      reason: "Smoking area present",
      details: "Property has smoking area (not preferred)",
      hasPreference: true,
    };
  }

  return {
    category: "smoking",
    match: true,
    score: maxScore,
    maxScore,
    reason: "Smoking policy acceptable",
    details: "No strong smoking preference",
    hasPreference: true,
  };
}
