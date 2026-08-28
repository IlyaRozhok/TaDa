import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";

/**
 * How the matched-properties feed is ordered.
 *
 * `best_match` is the scored path: every listed property is scored in TypeScript
 * and ranked by percentage. Every other value is a plain SQL ordering over the
 * same population — the scoring pass is skipped entirely, and the page that
 * comes back is still scored afterwards so the cards keep their match badge.
 */
export const MATCHED_PROPERTIES_SORTS = [
  "best_match",
  "low_price",
  "high_price",
  "low_deposit",
  "high_deposit",
  "date_added",
] as const;

export type MatchedPropertiesSort = (typeof MATCHED_PROPERTIES_SORTS)[number];

export const DEFAULT_MATCHED_PROPERTIES_SORT: MatchedPropertiesSort =
  "best_match";

/**
 * The one validated query parameter of `GET /matching/matched-properties`.
 *
 * `page`, `limit`, `search` and `prefilters` stay on their own `@Query(name)`
 * parameters with the caps the route already applied; only `sort` needs a
 * closed set, and an unknown value is a 400 rather than a silent fallback —
 * a feed quietly ordered by something other than what was asked for is the
 * bug this parameter exists to fix.
 */
export class GetMatchedPropertiesQueryDto {
  @ApiPropertyOptional({
    enum: MATCHED_PROPERTIES_SORTS,
    default: DEFAULT_MATCHED_PROPERTIES_SORT,
    description:
      "Ordering of the whole listed inventory. `best_match` scores every candidate and ranks by match percentage; the others order in SQL (price, deposit, creation date) with `created_at DESC` as the tie-break, and NULL prices/deposits sort last in both directions",
  })
  @IsOptional()
  @IsIn(MATCHED_PROPERTIES_SORTS)
  sort?: MatchedPropertiesSort;
}
