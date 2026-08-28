import type { MatchedPropertiesSort } from "@/store/api/matching.api";

/**
 * The sort keys of the results feed, as the UI names them. Declared here
 * rather than in the component so the map below and the component cannot
 * drift; `ListedPropertiesSection` re-exports it under the same name it always
 * had.
 */
export type SortOption =
  | "bestMatch"
  | "lowPrice"
  | "highPrice"
  | "lowDeposit"
  | "highDeposit"
  | "dateAdded";

/**
 * UI sort key -> the `sort` parameter of `GET /matching/matched-properties`.
 *
 * Every sort is now a server-side one: the feed reads a single endpoint and
 * the database orders the whole listed inventory before it is paginated. This
 * map is what replaced sorting the twelve rows the page happened to be
 * holding — which ordered the page, not the catalogue.
 *
 * Typed as a total `Record`, so adding a sort to `SortOption` without deciding
 * what the server should do with it stops compiling.
 */
export const MATCHED_SORT_BY_SORT_OPTION: Readonly<
  Record<SortOption, MatchedPropertiesSort>
> = {
  bestMatch: "best_match",
  lowPrice: "low_price",
  highPrice: "high_price",
  lowDeposit: "low_deposit",
  highDeposit: "high_deposit",
  dateAdded: "date_added",
};
