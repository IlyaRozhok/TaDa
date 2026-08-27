import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * THE unknown-data policy (package B4). One rule for every scorer:
 *
 *   The tenant set a preference, but the property carries no data to score
 *   it against → fixed partial credit, `match: false`, never a full score.
 *
 * Before this policy each scorer invented its own answer — a missing price
 * counted as £0 (full budget score when only max_price was set), a missing
 * availability date was 50% with `match: true`, a missing let duration was
 * 100% "flexible", and empty tenant targeting was 100% on three categories
 * at once. The net effect inverted the ranking's incentives: a listing with
 * blank fields outranked an honestly-filled near-miss, so operators were
 * rewarded for leaving data out.
 *
 * 0.3 matches the precedent the bedrooms scorer already set for missing
 * data: enough that an unknown is not treated as a hard mismatch, low
 * enough that filled-and-matching data always beats absent data.
 */
export const UNKNOWN_DATA_CREDIT = 0.3;

/** The uniform result for "preference set, property data missing". */
export function unknownPropertyData(
  category: string,
  maxScore: number,
  details: string,
): CategoryMatchResult {
  return {
    category,
    match: false,
    score: Math.round(maxScore * UNKNOWN_DATA_CREDIT),
    maxScore,
    reason: "No data on the property",
    details,
    hasPreference: true,
  };
}
