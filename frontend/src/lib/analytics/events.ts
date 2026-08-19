/**
 * The GA4 event catalog, frozen.
 *
 * Reporting is built on these exact event and parameter names, so they must not
 * drift. Every name and enum value lives here and nowhere else: call sites pass
 * a value of `AnalyticsEvent` and never a string literal, which makes a typo a
 * compile error rather than a silently missing report.
 *
 * Rules that hold for the whole catalog:
 *  - No PII. Parameters carry ids, enums, counts and booleans only — never an
 *    email, phone number or person's name. `search_performed.query` is the one
 *    free-text parameter and is filtered by `sanitizeSearchQuery` below.
 *  - The funnel ends at `viewing_requested`. Nothing after it is tracked.
 */

/** Sign-in method. Google OAuth is the only one the platform has. */
export type AnalyticsMethod = "google";

/** Sort applied to the results feed. */
export type SortType =
  | "best_match"
  | "price_low_high"
  | "price_high_low"
  | "deposit_low_high"
  | "deposit_high_low"
  | "newest";

/**
 * Reserved. `property_viewed` is specified to carry `listing_type`, but no
 * on-market/off-market field exists on the property entity or anywhere in the
 * API today, so the parameter is deliberately not sent.
 *
 * TODO: add `listing_type` to `property_viewed` once the backend exposes a real
 * on_market/off_market field on the property.
 */
export type ListingType = "on_market" | "off_market";

/** Step numbers of the Rental CV onboarding flow. */
export type OnboardingStepNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16;

export type OnboardingStepName =
  | "rental_cv_intro"
  | "discover"
  | "all_in_one_place"
  | "profile_kyc"
  | "location"
  | "budget"
  | "must_haves"
  | "rental_terms"
  | "tenant_type"
  | "pets"
  | "unit_amenities"
  | "building_amenities"
  | "occupation"
  | "interests"
  | "preferences"
  | "bio";

/**
 * step_number -> step_name for the 16-step flow.
 *
 * The order follows the flow as it actually renders — 3 intro screens, the
 * profile step, then the 12 preference steps of `NewPreferencesPage` — not the
 * step component file names, several of which are misleading (`CommuteTimeStep`
 * renders "Your move, your budget", `BudgetStep` renders "Must haves").
 * See `useOnboarding.ts` for the 3 + 1 + 12 split.
 */
export const STEP_NAMES: Readonly<
  Record<OnboardingStepNumber, OnboardingStepName>
> = {
  1: "rental_cv_intro",
  2: "discover",
  3: "all_in_one_place",
  4: "profile_kyc",
  5: "location",
  6: "budget",
  7: "must_haves",
  8: "rental_terms",
  9: "tenant_type",
  10: "pets",
  11: "unit_amenities",
  12: "building_amenities",
  13: "occupation",
  14: "interests",
  15: "preferences",
  16: "bio",
};

/**
 * Narrows a raw step counter to a step of the flow.
 *
 * The onboarding page carries `currentStep` as a plain number, so this is what
 * keeps `STEP_NAMES` total: a step outside 1..16 is not reported rather than
 * reported with an undefined name.
 */
export function isOnboardingStepNumber(
  step: number,
): step is OnboardingStepNumber {
  return Number.isInteger(step) && step >= 1 && step <= 16;
}

/** The internal sort keys of the results feed, as `ListedPropertiesSection` names them. */
type UiSortOption =
  | "bestMatch"
  | "lowPrice"
  | "highPrice"
  | "lowDeposit"
  | "highDeposit"
  | "dateAdded";

/**
 * UI sort key -> catalog `sort_type`. Indexing this with the component's own
 * `SortOption` is what keeps the two in step: add a sort to the UI without
 * adding it here and the call site stops compiling.
 */
export const SORT_TYPE_BY_SORT_OPTION: Readonly<Record<UiSortOption, SortType>> =
  {
    bestMatch: "best_match",
    lowPrice: "price_low_high",
    highPrice: "price_high_low",
    lowDeposit: "deposit_low_high",
    highDeposit: "deposit_high_low",
    dateAdded: "newest",
  };

/** Longest search string sent to GA4. */
const SEARCH_QUERY_MAX_LENGTH = 100;

/** Seven or more consecutive digits — long enough to be a phone number. */
const PHONE_LIKE_DIGIT_RUN = /\d{7,}/;

/**
 * Shapes a raw search box value into something safe to report, or drops it.
 *
 * The search box is free text: users type postcodes and street names, but
 * nothing stops them typing an email address or a phone number. Anything
 * carrying either marker is dropped entirely (the event still fires without the
 * parameter, so the funnel step is still counted); the rest is trimmed and
 * capped.
 *
 * Returns `undefined` when there is nothing safe to send.
 */
export function sanitizeSearchQuery(raw: string): string | undefined {
  const trimmed = raw.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.includes("@") || PHONE_LIKE_DIGIT_RUN.test(trimmed)) {
    return undefined;
  }

  return trimmed.slice(0, SEARCH_QUERY_MAX_LENGTH);
}

/**
 * The value `results_viewed.avg_match_score` reports.
 *
 * The server-side number wins whenever it is there: it is the mean over the
 * whole matched set, so it describes the same population as `results_count`
 * beside it. Only that pairing makes the parameter usable in GA4 — an average
 * of the twelve cards on screen against a count of several hundred describes
 * two different things.
 *
 * `serverAvg` is absent on a payload from a backend without the field, and
 * `null` when the server had nothing to average. Both fall back to the mean of
 * the scores that did resolve on the loaded page — a page-sized sample of the
 * same set, which is what this event reported before the server owned the
 * aggregate, and still better than reporting nothing.
 *
 * `resolvedPageScores` must contain only scores that actually arrived: a caller
 * that pads it with zeros for unresolved cards gets a fabricated average back,
 * which is exactly what this parameter must never carry.
 */
export function resolveAvgMatchScore(
  serverAvg: number | null | undefined,
  resolvedPageScores: readonly number[],
): number {
  if (typeof serverAvg === "number" && Number.isFinite(serverAvg)) {
    return serverAvg;
  }

  if (resolvedPageScores.length === 0) {
    // The mean of nothing, reported beside a `results_count` of 0.
    return 0;
  }

  const total = resolvedPageScores.reduce((sum, score) => sum + score, 0);

  // One decimal, matching what the server rounds to.
  return Math.round((total / resolvedPageScores.length) * 10) / 10;
}

/** What GA4's `page_view` carries. */
export interface PageViewParams {
  /** Full URL of the page, query string included. */
  page_location: string;
  /** Path and query, without the origin. */
  page_path: string;
  /** `document.title` at the moment of the view. */
  page_title: string;
}

/**
 * A page view. Deliberately *not* a member of `AnalyticsEvent`.
 *
 * Everything in that union goes through `track()`, which drops the event unless
 * a signed-in tenant is the one doing it. That gate is right for the funnel and
 * wrong for this: the visits Google Ads has to be able to see are the ones by a
 * visitor who has not signed in and has no role at all. So `page_view` is a
 * type of its own and `trackPageView()` in `ga.ts` sends it, sharing the same
 * environment guards and skipping only the role check.
 */
export type PageViewEvent = { name: "page_view"; params: PageViewParams };

/**
 * Assembles the parameters of one page view.
 *
 * `page_location` must carry the query string. Google reads `gclid` and the
 * `utm_*` parameters out of it, so a truncated location silently un-attributes
 * every paid click that lands on the site — which is the whole reason this
 * event exists. The hash is left out: it is not part of what Google reads, and
 * a hash change does not produce a navigation the tracker sees anyway.
 */
export function buildPageViewParams(
  origin: string,
  pathname: string,
  search: string,
  title: string,
): PageViewParams {
  const query = search ? (search.startsWith("?") ? search : `?${search}`) : "";
  const path = `${pathname}${query}`;

  return {
    page_location: `${origin}${path}`,
    page_path: path,
    page_title: title,
  };
}

/**
 * Every event the tenant funnel emits.
 *
 * KYC and referencing events are intentionally absent: no KYC or referencing
 * flow exists in the product, so there is no trigger and no backend success
 * signal to hang them on. They are added when that feature ships.
 */
export type AnalyticsEvent =
  /** First Google sign-in for this account. */
  | { name: "sign_up"; params: { method: AnalyticsMethod } }
  /** Repeat Google sign-in. */
  | { name: "login"; params: { method: AnalyticsMethod } }
  /** Landed on step 1 of the Rental CV. */
  | { name: "onboarding_started"; params: Record<string, never> }
  /** Next/Done on any of the 16 steps. */
  | {
      name: "onboarding_step_completed";
      params: {
        step_number: OnboardingStepNumber;
        step_name: OnboardingStepName;
      };
    }
  /** Done on step 16. */
  | { name: "onboarding_completed"; params: Record<string, never> }
  /** Share profile button produced a share link. */
  | { name: "profile_shared"; params: Record<string, never> }
  /** Opened own Tenant CV (not the public /cv/[uuid] view). */
  | { name: "tenant_cv_viewed"; params: Record<string, never> }
  /**
   * Results feed loaded, with scores resolved. Both parameters describe the
   * same population: `results_count` is the server-side total behind the feed,
   * and `avg_match_score` the mean over that same set — see
   * `resolveAvgMatchScore` for what happens when the server cannot supply it.
   */
  | {
      name: "results_viewed";
      params: { results_count: number; avg_match_score: number };
    }
  /** Sort changed on the results feed. */
  | { name: "results_sorted"; params: { sort_type: SortType } }
  /**
   * Query typed in the search bar. `query` is absent when the raw value was
   * dropped by `sanitizeSearchQuery`.
   */
  | { name: "search_performed"; params: { query?: string } }
  /** Change Preferences applied. */
  | { name: "preferences_changed"; params: Record<string, never> }
  /**
   * Property detail page opened, once the property and its match are loaded.
   * `listing_type` is missing on purpose — see `ListingType` above.
   */
  | {
      name: "property_viewed";
      params: {
        property_id: string;
        building_id: string | null;
        match_score: number;
        price_pcm: number | null;
        beds: number | null;
      };
    }
  /** Added to shortlist. */
  | { name: "property_favorited"; params: { property_id: string } }
  /** Removed from shortlist. */
  | { name: "property_unfavorited"; params: { property_id: string } }
  /** Building page opened. */
  | {
      name: "building_viewed";
      params: {
        building_id: string;
        units_total: number;
        units_available: number;
      };
    }
  /**
   * "Book your viewing" opened the request modal.
   *
   * `match_score` is optional, and omitted when the match query has not
   * resolved or has failed. A fallback value cannot be used: `0` is a valid
   * score, so a fabricated one would be indistinguishable from a genuine zero
   * match. The event still fires without it — the drop-off it measures against
   * `viewing_requested` matters more than the score on any single event.
   */
  | {
      name: "viewing_modal_opened";
      params: { property_id: string; match_score?: number };
    }
  /**
   * "Send request" accepted by the backend. End of the tracked funnel.
   * `match_score` is optional for the same reason as on `viewing_modal_opened`.
   */
  | {
      name: "viewing_requested";
      params: {
        property_id: string;
        building_id: string | null;
        match_score?: number;
        price_pcm: number | null;
        has_dates: boolean;
        has_notes: boolean;
      };
    };

/** Every event name in the catalog, for tests and tooling. */
export type AnalyticsEventName = AnalyticsEvent["name"];
