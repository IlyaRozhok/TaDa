import { describe, expect, it } from "vitest";
import {
  MATCHED_SORT_BY_SORT_OPTION,
  type SortOption,
} from "../listingSort";
// Relative, not aliased: vitest resolves no `@/` alias, so every spec here
// reaches its subject by path.
import { SORT_TYPE_BY_SORT_OPTION } from "../../../lib/analytics/events";

/**
 * The map is the whole contract between the sort dropdown and the server: a
 * missing or wrong entry silently serves a differently ordered feed, which is
 * exactly the bug server-side sorting was added to fix.
 */
describe("MATCHED_SORT_BY_SORT_OPTION", () => {
  const options = Object.keys(MATCHED_SORT_BY_SORT_OPTION) as SortOption[];

  it("maps every UI sort to the backend's snake_case parameter", () => {
    expect(MATCHED_SORT_BY_SORT_OPTION).toEqual({
      bestMatch: "best_match",
      lowPrice: "low_price",
      highPrice: "high_price",
      lowDeposit: "low_deposit",
      highDeposit: "high_deposit",
      dateAdded: "date_added",
    });
  });

  it("covers exactly the sorts analytics already knows about", () => {
    // Both maps are keyed by the same UI union, so a sort added to one and
    // forgotten in the other shows up here rather than in production.
    expect(options.sort()).toEqual(
      Object.keys(SORT_TYPE_BY_SORT_OPTION).sort(),
    );
  });

  it("never maps two UI sorts onto the same server ordering", () => {
    const params = Object.values(MATCHED_SORT_BY_SORT_OPTION);

    expect(new Set(params).size).toBe(params.length);
  });
});
