import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";
import { unknownPropertyData } from "./unknown-data";
import { splitPreferenceList } from "./preference-list";

/**
 * Helper to parse children count strings into numbers
 */
function parseChildrenCount(childrenCount: string): number {
  if (!childrenCount || childrenCount === "no") return 0;
  if (childrenCount.includes("1-child")) return 1;
  if (childrenCount.includes("2-children")) return 2;
  if (childrenCount.includes("3-plus")) return 3;
  return 0;
}

/**
 * Children compatibility matching (ENHANCED)
 * Matches user's children situation with property family-friendliness
 */
export function matchChildren(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  // Multi-select stored as a comma-joined string. The scoring below works on
  // the LARGEST selected children count (the binding constraint), so
  // "no,yes-1-child" behaves as one child, not as the unparseable joined
  // string it used to be.
  const childrenSelections = splitPreferenceList(preferences.children_count);
  const childrenCount = childrenSelections[0];
  const propertyTenantTypes = property.tenant_types || [];
  const propertyChildren = property.children || [];

  // No preference set - exclude from calculation
  if (!childrenCount) {
    return {
      category: "children",
      match: false,
      score: 0,
      maxScore: 0,
      reason: "No children preference specified",
      details: propertyTenantTypes.length
        ? `Property accepts: ${propertyTenantTypes.join(", ")}`
        : "Children policy not specified",
      hasPreference: false,
    };
  }

  // The binding constraint across the selection: the most children any
  // selected answer implies.
  const userChildrenNum = Math.max(
    ...childrenSelections.map((entry) => parseChildrenCount(entry)),
  );

  // User has no children
  if (userChildrenNum === 0) {
    return {
      category: "children",
      match: true,
      score: maxScore,
      maxScore,
      reason: "No children - compatible with all properties",
      details: "No children restrictions apply",
      hasPreference: true,
    };
  }

  // The explicit children policy is authoritative when present — it works
  // even when tenant types are blank (B4: signal order, then heuristics).
  if (propertyChildren.length === 0) {
    // No explicit children policy: fall back to the tenant-type heuristic,
    // or the unknown-data policy when there is no targeting data at all
    // (this used to be a free 100% — blank targeting beat honest listings).
    if (!propertyTenantTypes.length) {
      return unknownPropertyData(
        "children",
        maxScore,
        "No children policy on the property",
      );
    }

    const normalizedTenantTypes = propertyTenantTypes.map((t) =>
      t.toLowerCase(),
    );
    const isFamilyFriendly = normalizedTenantTypes.some((t) =>
      ["family", "elder"].includes(t),
    );

    if (!isFamilyFriendly) {
      return {
        category: "children",
        match: false,
        score: 0,
        maxScore,
        reason: "Property not suitable for children",
        details: `Property types (${propertyTenantTypes.join(", ")}) don't typically accept children`,
        hasPreference: true,
      };
    }

    // Family-friendly but no specific children policy - assume acceptable
    return {
      category: "children",
      match: true,
      score: Math.round(maxScore * 0.7),
      maxScore,
      reason: "Family-friendly property",
      details: "Property accepts families (children policy not specified)",
      hasPreference: true,
    };
  }

  // Check if property explicitly says no children
  if (propertyChildren.includes("no")) {
    return {
      category: "children",
      match: false,
      score: 0,
      maxScore,
      reason: "Property doesn't accept children",
      details: "Property explicitly excludes children",
      hasPreference: true,
    };
  }

  // Find the maximum number of children the property accepts
  const propertyMaxChildren = Math.max(
    ...propertyChildren.map(c => parseChildrenCount(c))
  );

  // Perfect match - property specifically accommodates this number of children
  const exactMatch = childrenSelections.find((entry) =>
    propertyChildren.includes(entry as any),
  );
  if (exactMatch) {
    return {
      category: "children",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Perfect children count match",
      details: `Property specifically accepts ${exactMatch.replace("yes-", "").replace("-", " ")}`,
      hasPreference: true,
    };
  }

  // Good match - property can accommodate this number of children
  if (propertyMaxChildren >= userChildrenNum) {
    return {
      category: "children",
      match: true,
      score: Math.round(maxScore * 0.9),
      maxScore,
      reason: "Children count compatible",
      details: `Property can accommodate ${userChildrenNum} child${userChildrenNum === 1 ? "" : "ren"}`,
      hasPreference: true,
    };
  }

  // Partial match - property has fewer children capacity than needed
  if (propertyMaxChildren > 0 && userChildrenNum > propertyMaxChildren) {
    return {
      category: "children",
      match: false,
      score: Math.round(maxScore * 0.3),
      maxScore,
      reason: "Limited children capacity",
      details: `Property accepts fewer children than you have`,
      hasPreference: true,
    };
  }

  return {
    category: "children",
    match: true,
    score: Math.round(maxScore * 0.8),
    maxScore,
    reason: "Children welcome",
    details: "Property is family-friendly",
    hasPreference: true,
  };
}
