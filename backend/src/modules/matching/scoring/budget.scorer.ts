import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Budget matching: min_price/max_price vs property.price
 */
export function matchBudget(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  const price = Number(property.price) || 0;
  const minPrice = preferences.min_price;
  const maxPrice = preferences.max_price;

  // No preference set - exclude from calculation
  if (!minPrice && !maxPrice) {
    return {
      category: "budget",
      match: false,
      score: 0,
      maxScore: 0,
      reason: "No budget preference set",
      details: `Property price: £${price}/month`,
      hasPreference: false,
    };
  }

  // Check if within range
  const isWithinMin = !minPrice || price >= minPrice;
  const isWithinMax = !maxPrice || price <= maxPrice;

  if (isWithinMin && isWithinMax) {
    return {
      category: "budget",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Within budget",
      details: `£${price}/month is within £${minPrice || 0}-£${
        maxPrice || "∞"
      } range`,
      hasPreference: true,
    };
  }

  // Calculate partial score for close matches
  if (maxPrice && price > maxPrice) {
    const overBy = ((price - maxPrice) / maxPrice) * 100;
    if (overBy <= 10) {
      // Within 10% over budget - partial match
      const partialScore = Math.round(maxScore * 0.5);
      return {
        category: "budget",
        match: false,
        score: partialScore,
        maxScore,
        reason: "Slightly over budget",
        details: `£${price}/month is ${overBy.toFixed(
          1,
        )}% over max budget of £${maxPrice}`,
        hasPreference: true,
      };
    }
  }

  if (minPrice && price < minPrice) {
    const underBy = ((minPrice - price) / minPrice) * 100;
    if (underBy <= 20) {
      // Within 20% under budget - partial match (might be lower quality)
      const partialScore = Math.round(maxScore * 0.7);
      return {
        category: "budget",
        match: false,
        score: partialScore,
        maxScore,
        reason: "Under budget",
        details: `£${price}/month is ${underBy.toFixed(
          1,
        )}% under min budget of £${minPrice}`,
        hasPreference: true,
      };
    }
  }

  return {
    category: "budget",
    match: false,
    score: 0,
    maxScore,
    reason: "Outside budget range",
    details: `£${price}/month is outside £${minPrice || 0}-£${
      maxPrice || "∞"
    } range`,
    hasPreference: true,
  };
}
