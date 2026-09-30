/**
 * Pure shaping for the admin statistics bundle. The SQL does the counting
 * (every query is a GROUP BY or a single aggregate); these helpers only order,
 * bucket and label the handful of rows that come back, so they can be tested
 * without a database.
 */

export interface CountRow {
  value: string | null;
  count: number;
}

export interface GroupCount {
  group: string;
  count: number;
}

/** Age groups for the tenant demographics chart, in display order. */
export const AGE_GROUPS: ReadonlyArray<{ group: string; min: number; max: number }> = [
  { group: "18-24", min: 18, max: 24 },
  { group: "25-34", min: 25, max: 34 },
  { group: "35-44", min: 35, max: 44 },
  { group: "45-54", min: 45, max: 54 },
  { group: "55+", min: 55, max: Number.POSITIVE_INFINITY },
];

export const UNDER_18_GROUP = "under-18";

/**
 * Folds per-age counts (one row per distinct age, null for a missing date of
 * birth) into the fixed groups. The profile form enforces 18+, but the API
 * does not, so younger ages get their own group — shown only when non-empty
 * rather than silently merged into "unknown".
 */
export function bucketAges(rows: ReadonlyArray<{ age: number | null; count: number }>): {
  groups: GroupCount[];
  unknown: number;
} {
  const groups = AGE_GROUPS.map(({ group }) => ({ group, count: 0 }));
  let under18 = 0;
  let unknown = 0;

  for (const { age, count } of rows) {
    if (age === null || !Number.isFinite(age) || age < 0) {
      unknown += count;
      continue;
    }
    if (age < 18) {
      under18 += count;
      continue;
    }
    const index = AGE_GROUPS.findIndex(({ min, max }) => age >= min && age <= max);
    groups[index].count += count;
  }

  return {
    groups: under18 > 0 ? [{ group: UNDER_18_GROUP, count: under18 }, ...groups] : groups,
    unknown,
  };
}

/** Monthly rent ceiling buckets (GBP), in display order. */
export const BUDGET_BUCKETS: ReadonlyArray<{ bucket: string; min: number; max: number }> = [
  { bucket: "< £1,000", min: 0, max: 999 },
  { bucket: "£1,000-1,499", min: 1000, max: 1499 },
  { bucket: "£1,500-1,999", min: 1500, max: 1999 },
  { bucket: "£2,000-2,499", min: 2000, max: 2499 },
  { bucket: "£2,500-2,999", min: 2500, max: 2999 },
  { bucket: "£3,000-3,999", min: 3000, max: 3999 },
  { bucket: "£4,000+", min: 4000, max: Number.POSITIVE_INFINITY },
];

/** Folds per-price counts (one row per distinct `max_price`) into the buckets. */
export function bucketBudgets(rows: ReadonlyArray<{ price: number | null; count: number }>): {
  buckets: Array<{ bucket: string; count: number }>;
  unknown: number;
} {
  const buckets = BUDGET_BUCKETS.map(({ bucket }) => ({ bucket, count: 0 }));
  let unknown = 0;

  for (const { price, count } of rows) {
    if (price === null || !Number.isFinite(price) || price < 0) {
      unknown += count;
      continue;
    }
    const index = BUDGET_BUCKETS.findIndex(({ min, max }) => price >= min && price <= max);
    buckets[index].count += count;
  }

  return { buckets, unknown };
}

/**
 * Keeps the `limit` largest values and folds the rest into `other`. Null or
 * blank values are counted as `unknown`. Ties break alphabetically so the
 * order is stable between requests.
 */
export function topNWithOther(
  rows: ReadonlyArray<CountRow>,
  limit: number,
): { items: Array<{ value: string; count: number }>; other: number; unknown: number } {
  let unknown = 0;
  const known: Array<{ value: string; count: number }> = [];

  for (const { value, count } of rows) {
    const trimmed = value?.trim();
    if (!trimmed) unknown += count;
    else known.push({ value: trimmed, count });
  }

  known.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  return {
    items: known.slice(0, limit),
    other: known.slice(limit).reduce((sum, row) => sum + row.count, 0),
    unknown,
  };
}

/**
 * Country names exactly as the profile form's nationality dropdown stores
 * them — keep in step with `frontend/src/shared/lib/countries.ts`.
 */
export const DROPDOWN_COUNTRIES: ReadonlyArray<string> = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "Italy", "Spain", "Netherlands", "Belgium", "Switzerland", "Austria", "Sweden",
  "Norway", "Denmark", "Finland", "Poland", "Czech Republic", "Greece", "Portugal",
  "Ireland", "Ukraine", "Russia", "Japan", "China", "India", "Brazil", "Mexico",
  "Argentina", "South Africa", "New Zealand", "Singapore", "Hong Kong", "South Korea",
  "Taiwan", "Thailand", "Malaysia", "Indonesia", "Philippines", "Vietnam", "Turkey",
  "Saudi Arabia", "United Arab Emirates", "Israel", "Egypt", "Nigeria", "Kenya",
];

/**
 * Older profiles hold free-text nationalities — demonyms ("British") and
 * short forms ("UK") — that would split a country across several bars. Keys
 * are lower-case; values must be names from `DROPDOWN_COUNTRIES`. Extend here
 * when a new variant shows up on the dashboard.
 */
export const NATIONALITY_ALIASES: Readonly<Record<string, string>> = {
  british: "United Kingdom",
  english: "United Kingdom",
  scottish: "United Kingdom",
  welsh: "United Kingdom",
  "northern irish": "United Kingdom",
  uk: "United Kingdom",
  "great britain": "United Kingdom",
  england: "United Kingdom",
  scotland: "United Kingdom",
  wales: "United Kingdom",
  american: "United States",
  us: "United States",
  usa: "United States",
  "united states of america": "United States",
  canadian: "Canada",
  australian: "Australia",
  german: "Germany",
  french: "France",
  italian: "Italy",
  spanish: "Spain",
  dutch: "Netherlands",
  "the netherlands": "Netherlands",
  holland: "Netherlands",
  belgian: "Belgium",
  swiss: "Switzerland",
  austrian: "Austria",
  swedish: "Sweden",
  norwegian: "Norway",
  danish: "Denmark",
  finnish: "Finland",
  polish: "Poland",
  czech: "Czech Republic",
  czechia: "Czech Republic",
  greek: "Greece",
  portuguese: "Portugal",
  irish: "Ireland",
  ukrainian: "Ukraine",
  russian: "Russia",
  japanese: "Japan",
  chinese: "China",
  indian: "India",
  brazilian: "Brazil",
  mexican: "Mexico",
  argentinian: "Argentina",
  argentine: "Argentina",
  "south african": "South Africa",
  "new zealander": "New Zealand",
  kiwi: "New Zealand",
  singaporean: "Singapore",
  "hong konger": "Hong Kong",
  "south korean": "South Korea",
  korean: "South Korea",
  taiwanese: "Taiwan",
  thai: "Thailand",
  malaysian: "Malaysia",
  indonesian: "Indonesia",
  filipino: "Philippines",
  filipina: "Philippines",
  vietnamese: "Vietnam",
  turkish: "Turkey",
  "türkiye": "Turkey",
  saudi: "Saudi Arabia",
  "saudi arabian": "Saudi Arabia",
  emirati: "United Arab Emirates",
  uae: "United Arab Emirates",
  israeli: "Israel",
  egyptian: "Egypt",
  nigerian: "Nigeria",
  kenyan: "Kenya",
};

const COUNTRY_BY_LOWER = new Map(DROPDOWN_COUNTRIES.map((name) => [name.toLowerCase(), name]));

/**
 * The dropdown's country name for a stored nationality: aliases and case
 * variants collapse onto it, anything unrecognised passes through trimmed,
 * blank becomes null.
 */
export function normalizeNationality(value: string | null): string | null {
  const trimmed = value?.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  return NATIONALITY_ALIASES[key] ?? COUNTRY_BY_LOWER.get(key) ?? trimmed;
}

/** Re-groups raw nationality counts by their normalized country. */
export function mergeNationalities(rows: ReadonlyArray<CountRow>): CountRow[] {
  const merged = new Map<string | null, number>();
  for (const { value, count } of rows) {
    const country = normalizeNationality(value);
    merged.set(country, (merged.get(country) ?? 0) + count);
  }
  return [...merged].map(([value, count]) => ({ value, count }));
}

/** Readable labels for the preference wizard's lifestyle slugs. */
export const OCCUPATION_LABELS: Readonly<Record<string, string>> = {
  student: "Student",
  "young-professional": "Young professional",
  "freelancer-remote-worker": "Freelancer / remote worker",
  "business-owner": "Business owner",
  "family-professional": "Family professional",
  other: "Other",
};

export const FAMILY_STATUS_LABELS: Readonly<Record<string, string>> = {
  "just-me": "Just me",
  couple: "Couple",
  "couple-with-children": "Couple with children",
  "single-parent": "Single parent",
  "friends-flatmates": "Friends / flatmates",
};

/** Mapped label, or the slug made readable when it is not in the map. */
export function labelFor(slug: string, labels: Readonly<Record<string, string>>): string {
  if (labels[slug]) return labels[slug];
  const words = slug.replace(/[-_]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : slug;
}

/**
 * Multi-select breakdown: each tenant can pick several values, so shares are
 * of `base` (tenants with preferences) and add up to more than 100%.
 */
export function withShares(
  rows: ReadonlyArray<CountRow>,
  base: number,
  labels: Readonly<Record<string, string>>,
): Array<{ value: string; label: string; count: number; pctOfTenants: number }> {
  return rows
    .filter((row): row is { value: string; count: number } => Boolean(row.value?.trim()))
    .map(({ value, count }) => ({
      value,
      label: labelFor(value, labels),
      count,
      pctOfTenants: base > 0 ? Math.round((count / base) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * The signups query only returns months that had signups; a line chart needs
 * the empty months too. Fills every `YYYY-MM` from the earliest of (first row,
 * `from`) to the latest of (last row, `to`).
 */
export function fillMonths<T extends { bucket: string }>(
  rows: ReadonlyArray<T>,
  empty: (bucket: string) => T,
  from?: string,
  to?: string,
): T[] {
  const byBucket = new Map(rows.map((row) => [row.bucket, row]));
  const candidates = [...byBucket.keys(), from?.slice(0, 7), to?.slice(0, 7)].filter(
    (value): value is string => Boolean(value),
  );
  if (!candidates.length) return [];

  candidates.sort();
  const [startYear, startMonth] = candidates[0].split("-").map(Number);
  const last = candidates[candidates.length - 1];

  const filled: T[] = [];
  let year = startYear;
  let month = startMonth;
  for (;;) {
    const bucket = `${year}-${String(month).padStart(2, "0")}`;
    filled.push(byBucket.get(bucket) ?? empty(bucket));
    if (bucket >= last) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return filled;
}
