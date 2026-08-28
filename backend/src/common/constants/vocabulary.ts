/**
 * The governed vocabulary for categorical fields the matching engine
 * compares by string equality (review roadmap, package B3).
 *
 * Before this module existed the value sets lived only in Swagger examples,
 * and they disagreed with each other: three spellings of "part furnished"
 * (`part_furnished` / `partially_furnished` / `part-furnished`) and two of
 * co-living (`co_living` / `co-living`) were all in circulation. Scorers
 * compare exact lowercase strings, so every drifted variant silently scored
 * as "no match" — corrupting the ranking instead of erroring.
 *
 * One rule: canonical values are lowercase snake_case. DTOs normalize known
 * aliases on the way in (so no client breaks) and reject anything outside
 * the canon; the B3 migration normalized the data already stored.
 */

export const FURNISHING_VALUES = [
  "furnished",
  "unfurnished",
  "part_furnished",
] as const;

export const PROPERTY_TYPE_VALUES = [
  "apartment",
  "flat",
  "studio",
  "penthouse",
  "room",
  "house",
  "maisonette",
  "duplex",
] as const;

export const BUILDING_TYPE_VALUES = [
  "btr",
  "co_living",
  "professional_management",
  "private_landlord",
] as const;

/** Property side: a listing either includes bills or it does not. */
export const PROPERTY_BILLS_VALUES = ["included", "excluded"] as const;

/** Preferences side additionally allows the "some included is fine" stance. */
export const PREFERENCE_BILLS_VALUES = [
  "included",
  "excluded",
  "some_included",
] as const;

/**
 * `let_duration` is a comma-separated multiselect on BOTH sides (see
 * duration.scorer); these are the tokens.
 */
export const LET_DURATION_VALUES = [
  "short_term",
  "medium_term",
  "long_term",
  "flexible",
  "6_months",
  "12_months",
] as const;

/**
 * Every variant ever observed in the codebase or its data, mapped to its
 * canonical value. Sources: the entity Swagger docs, the Preferences enums,
 * the frontend option constants and the scorers' own fallback lists.
 */
const ALIASES: Record<string, string> = {
  // furnishing
  "part-furnished": "part_furnished",
  partially_furnished: "part_furnished",
  "partially-furnished": "part_furnished",
  // building type
  "co-living": "co_living",
  // let duration
  "short-term": "short_term",
  "medium-term": "medium_term",
  "long-term": "long_term",
  "6-months": "6_months",
  "12-months": "12_months",
  "6 months": "6_months",
  "12 months": "12_months",
  // property type
  "en-suite room": "room",
  "en_suite_room": "room",
};

/**
 * Lowercase, trim, and resolve known aliases. Unknown values pass through
 * (lowercased) for the validator to reject — normalization never invents
 * data.
 */
export function normalizeVocabularyValue(value: string): string {
  const lowered = value.trim().toLowerCase();
  return ALIASES[lowered] ?? lowered;
}

/** Element-wise normalization for jsonb array fields. */
export function normalizeVocabularyList(values: string[]): string[] {
  return values.map(normalizeVocabularyValue);
}

/** Normalization for the comma-separated `let_duration` multiselect. */
export function normalizeDurationList(value: string): string {
  return value
    .split(",")
    .map(normalizeVocabularyValue)
    .filter(Boolean)
    .join(",");
}

/**
 * Regex accepting a comma-separated list of canonical duration tokens —
 * `class-validator`'s @Matches wants a pattern, and the multiselect shape
 * rules out a plain @IsIn.
 */
export const LET_DURATION_LIST_PATTERN = new RegExp(
  `^(${LET_DURATION_VALUES.join("|")})(,(${LET_DURATION_VALUES.join("|")}))*$`,
);
