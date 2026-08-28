import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, SelectQueryBuilder } from "typeorm";
import { Property } from "@/entities";
import { Preferences } from "@/entities";
import { PropertyStatus } from "@/entities/property.entity";
import { MatchingCalculationService } from "./services/matching-calculation.service";
import { S3Service } from "@/common/services/s3.service";
import { stripOperatorPii } from "@/common/mappers/public-operator.mapper";
import {
  DEFAULT_MATCHED_PROPERTIES_SORT,
  MatchedPropertiesSort,
} from "./dto/get-matched-properties.dto";
import {
  PropertyMatchResult,
  MatchScoresResponse,
  DEFAULT_WEIGHTS,
} from "./interfaces/matching.interfaces";

/**
 * Every `Property` column the scoring engine reads, taken from
 * `matching-calculation.service.ts` rather than guessed: those are the only
 * fields the ranking pass needs, so it selects these and nothing else.
 *
 * `address`, `borough` and `metro_stations` are read by `matchLocation`
 * (category 18, wired in since package B2).
 *
 * `id` is the join back to the hydration query, `created_at` is the tie-break
 * order. Neither is read by the scoring engine.
 */
const SCORING_COLUMNS = [
  "id",
  "created_at",
  "address",
  "amenities",
  "available_from",
  "balcony",
  "bathrooms",
  "bedrooms",
  "bills",
  "borough",
  "building_type",
  "children",
  "family_status",
  "furnishing",
  "let_duration",
  "metro_stations",
  "occupation",
  "pet_policy",
  "pets",
  "price",
  "property_amenities",
  "property_type",
  "square_meters",
  "tenant_types",
  "terrace",
] as const;

/**
 * The mean match score of a whole scored set, to one decimal.
 *
 * `null` when there is nothing to average — a user with no preferences, or a
 * filter that matched no property. That is not the same as a mean of 0, and the
 * two must not collapse: analytics reads this number, and a fabricated 0 is
 * indistinguishable from a genuine set of zero matches once it is reported.
 */
export function averageMatchPercentage(
  results: Array<{ matchPercentage: number }>,
): number | null {
  if (results.length === 0) {
    return null;
  }

  const total = results.reduce((sum, result) => sum + result.matchPercentage, 0);

  return Math.round((total / results.length) * 10) / 10;
}

/**
 * Hard ceiling on how many rows the ranking pass will load and score in one
 * request. Sub-PR B of 6.2 measured p50 84 ms at 5,000 properties, so this is
 * a protective bound far above the current inventory, not a product decision:
 * if the table ever outgrows it, the NEWEST `RANKING_CANDIDATE_CEILING` rows
 * are ranked (the ranking query orders by `created_at DESC`) and older stock
 * silently leaves the "Best Match" feed — revisit the read path before then.
 */
const RANKING_CANDIDATE_CEILING = 5000;

/**
 * The SQL ordering behind every sort that is not `best_match`, mapped to the
 * real `Property` columns.
 *
 * `NULLS LAST` in both directions on purpose: `price` and `deposit` are
 * nullable, and Postgres would otherwise float every unpriced listing to the
 * top of "highest price" (DESC defaults to NULLS FIRST). A listing with no
 * price is not the most expensive one — it sinks under either direction.
 */
const SORT_ORDER_BY: Readonly<
  Record<
    Exclude<MatchedPropertiesSort, "best_match">,
    { column: string; direction: "ASC" | "DESC" }
  >
> = {
  low_price: { column: "property.price", direction: "ASC" },
  high_price: { column: "property.price", direction: "DESC" },
  low_deposit: { column: "property.deposit", direction: "ASC" },
  high_deposit: { column: "property.deposit", direction: "DESC" },
  date_added: { column: "property.created_at", direction: "DESC" },
};

/**
 * The tie-break, and the whole ordering of `best_match` on the paths that do
 * not score (a user with no preferences). It is also what decides which rows
 * survive `RANKING_CANDIDATE_CEILING`.
 */
const TIE_BREAK_COLUMN = "property.created_at";

/**
 * Order a property query by one of the feed's sorts.
 *
 * `best_match` has no SQL ordering of its own — the ranking happens in
 * TypeScript — so it falls back to the tie-break alone, which is exactly what
 * the no-preferences path wants.
 */
function applyPropertySort(
  qb: SelectQueryBuilder<Property>,
  sort: MatchedPropertiesSort,
): SelectQueryBuilder<Property> {
  if (sort === "best_match") {
    return qb.orderBy(TIE_BREAK_COLUMN, "DESC");
  }

  const { column, direction } = SORT_ORDER_BY[sort];
  qb.orderBy(column, direction, "NULLS LAST");

  // A second ORDER BY on the same column would be dead weight; `date_added`
  // already IS the tie-break.
  if (column !== TIE_BREAK_COLUMN) {
    qb.addOrderBy(TIE_BREAK_COLUMN, "DESC");
  }

  return qb;
}

/**
 * One cached outcome of the ranking pass — the sorted id list and the
 * set-level numbers, NOT the page payload. Categories and photo URLs are
 * per-page work and stay uncached.
 */
interface RankingCacheEntry {
  rankedIds: string[];
  total: number;
  avgMatchScore: number | null;
  expiresAt: number;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  /**
   * Ranking cache: keyed by user + preferences version + search + prefilters,
   * so editing preferences misses the cache by construction (the key embeds
   * `preferences.updated_at`). The one staleness this admits: a property
   * created, deleted or re-priced inside the TTL is missing from / misplaced
   * in the ranking for up to RANKING_CACHE_TTL_MS. Deleted rows still never
   * reach the client — hydration drops ids that no longer exist.
   *
   * In-memory on purpose: the backend is a single container (docker-compose,
   * one replica), so there is no second instance to disagree with.
   */
  private readonly rankingCache = new Map<string, RankingCacheEntry>();
  private static readonly RANKING_CACHE_TTL_MS = 60_000;
  private static readonly RANKING_CACHE_MAX_ENTRIES = 100;

  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Preferences)
    private readonly preferencesRepository: Repository<Preferences>,
    private readonly calculationService: MatchingCalculationService,
    private readonly s3Service: S3Service
  ) {}

  private getCachedRanking(key: string): RankingCacheEntry | undefined {
    const entry = this.rankingCache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.rankingCache.delete(key);
      return undefined;
    }
    return entry;
  }

  private setCachedRanking(key: string, entry: RankingCacheEntry): void {
    for (const [existingKey, existing] of this.rankingCache) {
      if (existing.expiresAt <= Date.now()) {
        this.rankingCache.delete(existingKey);
      }
    }
    if (this.rankingCache.size >= MatchingService.RANKING_CACHE_MAX_ENTRIES) {
      // Map iterates in insertion order — the first key is the oldest entry.
      const oldest = this.rankingCache.keys().next().value;
      if (oldest !== undefined) this.rankingCache.delete(oldest);
    }
    this.rankingCache.set(key, entry);
  }

  private async updatePhotosUrls(property: Property): Promise<Property> {
    return this.s3Service.refreshMediaUrls(property, {
      arrayFields: ["photos"],
    });
  }

  /**
   * Narrow the candidate set in SQL before the scoring pass runs.
   *
   * Opt-in, via `?prefilters=true` on `matched-properties`. This used to be
   * unconditional on the deleted `/matches` route and absent from the paginated
   * one, which is how the same property could be visible in one read of the
   * domain and missing from the other. The ranges are generous on purpose so
   * near misses survive to be scored — the JS engine handles partial credit;
   * this only drops rows that could never rank.
   */
  private applyPreFilters(
    qb: SelectQueryBuilder<Property>,
    preferences: Preferences,
  ): SelectQueryBuilder<Property> {
    // Budget filter (weight 18) — include 10% over max and 20% under min
    // to keep partial-match candidates in the result set
    if (preferences.max_price) {
      const upperBound = Math.round(preferences.max_price * 1.1);
      qb.andWhere(
        "(property.price IS NULL OR property.price <= :upperBound)",
        { upperBound },
      );
    }
    if (preferences.min_price) {
      const lowerBound = Math.round(preferences.min_price * 0.8);
      qb.andWhere(
        "(property.price IS NULL OR property.price >= :lowerBound)",
        { lowerBound },
      );
    }

    // Bedrooms filter (weight 12) — include ±1 for close-match scoring
    if (preferences.bedrooms && preferences.bedrooms.length > 0) {
      const minBed = Math.max(0, Math.min(...preferences.bedrooms) - 1);
      const maxBed = Math.max(...preferences.bedrooms) + 1;
      qb.andWhere(
        "(property.bedrooms IS NULL OR (property.bedrooms >= :minBed AND property.bedrooms <= :maxBed))",
        { minBed, maxBed },
      );
    }

    // Property type filter (weight 10) — exact match only, but keep NULLs
    if (preferences.property_types && preferences.property_types.length > 0) {
      const normalizedTypes = preferences.property_types.map((t) =>
        t.toLowerCase().trim(),
      );
      qb.andWhere(
        "(property.property_type IS NULL OR LOWER(property.property_type) IN (:...propertyTypes))",
        { propertyTypes: normalizedTypes },
      );
    }

    return qb;
  }

  /**
   * Get detailed match for a specific property
   */
  async getPropertyMatch(
    propertyId: string,
    userId: string
  ): Promise<PropertyMatchResult> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      throw new NotFoundException("User preferences not found");
    }

    return this.calculationService.calculateMatch(
      property,
      preferences,
      DEFAULT_WEIGHTS
    );
  }

  /**
   * Score a batch of properties for one user — the card grids' read path.
   *
   * This is `getPropertyMatch` for many ids at once and must stay numerically
   * identical to it: same entity shape (no relations, exactly as `findOne`
   * loads it), same `MatchingCalculationService`, same `DEFAULT_WEIGHTS`.
   * A user with no preferences gets an empty map rather than a 404 — a grid
   * asking for scores is not an error case, it simply has nothing to show.
   */
  async getMatchScores(
    propertyIds: string[],
    userId: string
  ): Promise<MatchScoresResponse> {
    const uniqueIds = [...new Set(propertyIds)];

    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences || uniqueIds.length === 0) {
      return { scores: {} };
    }

    const properties = await this.propertyRepository.find({
      where: { id: In(uniqueIds) },
    });

    const scores: MatchScoresResponse["scores"] = {};

    for (const property of properties) {
      const result = this.calculationService.calculateMatch(
        property,
        preferences,
        DEFAULT_WEIGHTS
      );

      scores[property.id] = {
        matchScore: result.matchPercentage,
        categories: result.categories,
      };
    }

    return { scores };
  }

  /**
   * The single read path for the results feed: the FULL listed inventory,
   * paginated, searchable and ordered by `options.sort`. Every screen that
   * shows matched listings reads it from here, under every sort.
   *
   * The population is `status = 'listed'` (plus the search), and nothing else.
   * A property that scores badly is not hidden — it is scored honestly, given
   * its real low percentage and sunk to the bottom of `best_match`. `total` is
   * therefore the full listed count, the same number the public catalogue
   * reports, and paging never runs out of stock the user can see elsewhere.
   *
   * `options.prefilters` narrows the candidate set in SQL before scoring — see
   * `applyPreFilters`. **Off by default**: it is an opt-in debug flag
   * (`?prefilters=true`), kept so the behaviour of the deleted `/matches`
   * route stays reachable rather than being dropped. Turning it on trades the
   * full inventory for a smaller scoring pass and makes `total` a subset.
   *
   * `options.sort` other than `best_match` skips the TypeScript scoring pass
   * altogether and orders in SQL (see `applyPropertySort`); the returned page
   * is still scored afterwards, so every card keeps its real match badge.
   */
  async getMatchedPropertiesWithPagination(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      prefilters?: boolean;
      sort?: MatchedPropertiesSort;
    } = {}
  ): Promise<{
    data: Array<{
      property: Property;
      matchScore: number;
      categories: Array<{
        category: string;
        match: boolean;
        score: number;
        maxScore: number;
        reason: string;
        details?: string;
        hasPreference: boolean;
      }>;
    }>;
    total: number;
    page: number;
    totalPages: number;
    /**
     * Mean match score over the ENTIRE matched set — the same population
     * `total` counts, not the page in `data`. Page-independent: it is a
     * property of this tenant and these filters, so every consumer of the feed
     * can report it beside `total` and describe one population with both.
     *
     * `null` when that mean is not knowable: nothing was scored (a user with
     * no preferences), or the feed was ordered in SQL under a non-`best_match`
     * sort, which deliberately scores only the returned page. Never a
     * fabricated 0 — the client falls back to the page it was given.
     */
    avgMatchScore: number | null;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 12;
    const search = options.search?.trim();
    const sort = options.sort ?? DEFAULT_MATCHED_PROPERTIES_SORT;

    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    // One predicate, used by both read paths below. It reads `building.name`,
    // so any query applying it has to join the building. Address, postcode
    // and borough joined the predicate in B2 — "Camden" or "NW1" must find
    // listings, not just title substrings.
    const searchPredicate =
      "(property.apartment_number ILIKE :search OR property.title ILIKE :search OR property.address ILIKE :search OR property.postcode ILIKE :search OR property.borough ILIKE :search OR building.name ILIKE :search OR property.id::text ILIKE :search)";
    const searchParameters = { search: `%${search ?? ""}%` };

    if (!preferences) {
      // No preferences — use DB-level pagination (no scoring needed).
      // `options.prefilters` is derived from preferences, so it has nothing to
      // apply here and is ignored rather than answering with an empty page.
      const qb = this.propertyRepository
        .createQueryBuilder("property")
        .leftJoinAndSelect("property.building", "building")
        .leftJoinAndSelect("property.operator", "operator")
        // Matching feeds serve live inventory only — same rule as the public
        // catalogue.
        .where("property.status = :listedStatus", {
          listedStatus: PropertyStatus.Listed,
        });

      if (search) {
        qb.andWhere(searchPredicate, searchParameters);
      }

      const total = await qb.getCount();
      const skip = (page - 1) * limit;

      // The sort is honoured here too: a user with no preferences has no
      // ranking to ask for, but "cheapest first" is still a plain question
      // about the inventory. `best_match` falls back to newest-first, which
      // is what this branch has always returned.
      const properties = await applyPropertySort(qb, sort)
        .skip(skip)
        .take(limit)
        .getMany();

      const data = await Promise.all(
        properties.map(async (property) => ({
          property: stripOperatorPii(await this.updatePhotosUrls(property)),
          matchScore: 0,
          categories: [] as Array<{
            category: string;
            match: boolean;
            score: number;
            maxScore: number;
            reason: string;
            details?: string;
            hasPreference: boolean;
          }>,
        }))
      );

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        // Nothing was scored on this path, so there is no average to report.
        avgMatchScore: null,
      };
    }

    if (sort !== "best_match") {
      // A sort the database can answer. There is no reason to score the whole
      // inventory to order it by price, so this path does not: it orders and
      // paginates in SQL over the same `status = 'listed'` (+ search)
      // population, then scores only the twelve rows it is about to return so
      // their badges still show the real percentage.
      //
      // The ids come from a projection rather than a hydrating query so the
      // ordering never has to fight TypeORM's join pagination; the ORDER BY
      // columns are selected explicitly for the same reason.
      const idQb = this.propertyRepository
        .createQueryBuilder("property")
        .select([
          "property.id",
          "property.price",
          "property.deposit",
          "property.created_at",
        ])
        .where("property.status = :listedStatus", {
          listedStatus: PropertyStatus.Listed,
        });

      if (search) {
        // A join, not a joinAndSelect: the predicate reads `building.name`
        // but this pass has no use for the building's columns.
        idQb
          .leftJoin("property.building", "building")
          .andWhere(searchPredicate, searchParameters);
      }

      const total = await idQb.getCount();
      const skip = (page - 1) * limit;

      const pageRows = await applyPropertySort(idQb, sort)
        .skip(skip)
        .take(limit)
        .getMany();

      return {
        data: await this.scorePage(
          pageRows.map((row) => row.id),
          preferences
        ),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        // The set-level mean is a property of the scored set, and this path
        // scored a page, not a set. Reporting the page's mean as the set's
        // would be a different number wearing the same name.
        avgMatchScore: null,
      };
    }

    // SQL pre-filters are OFF by default: the feed's job is to rank the FULL
    // listed inventory, and a property that falls outside the user's budget or
    // bedroom range still belongs in it — at its real, low percentage, below
    // everything that fits. Pre-filtering deleted those rows from the feed
    // entirely, which is what made `total` disagree with the public catalogue.
    // `?prefilters=true` opts back in: a debug escape hatch that keeps the
    // behaviour of the deleted `/matches` route reachable.
    const usePrefilters = options.prefilters ?? false;

    // Phase 1 — rank, through the cache.
    //
    // The ranking pass still reads only the scoring columns (no relations, no
    // unused columns), but its outcome — the sorted id list and the set-level
    // numbers — is now cached per (user, preferences version, search,
    // prefilters) for RANKING_CACHE_TTL_MS. Paging through results costs one
    // ranking pass, not one per page.
    const cacheKey = [
      userId,
      preferences.updated_at?.getTime() ?? 0,
      search ?? "",
      usePrefilters ? 1 : 0,
    ].join("|");

    let ranking = this.getCachedRanking(cacheKey);

    if (!ranking) {
      const rankingQb = this.propertyRepository
        .createQueryBuilder("property")
        .select(SCORING_COLUMNS.map((column) => `property.${column}`))
        // Only live inventory is ranked: an under-offer or let flat must not
        // keep collecting "Best Match" impressions.
        .where("property.status = :listedStatus", {
          listedStatus: PropertyStatus.Listed,
        })
        // The sort below is stable, so this decides the order of equal scores
        // — and, at the ceiling, which rows are considered at all.
        .orderBy("property.created_at", "DESC")
        .take(RANKING_CANDIDATE_CEILING);

      if (usePrefilters) {
        this.applyPreFilters(rankingQb, preferences);
      }

      if (search) {
        // A join, not a joinAndSelect: the search predicate reads
        // `building.name` but the ranking pass has no use for its columns.
        rankingQb
          .leftJoin("property.building", "building")
          .andWhere(searchPredicate, searchParameters);
      }

      const candidates = await rankingQb.getMany();

      if (candidates.length === RANKING_CANDIDATE_CEILING) {
        // At the ceiling the query stops being "the whole inventory" and
        // becomes "the newest 5,000 rows of it" — the oldest stock leaves the
        // feed with no other symptom. Say so before a tenant notices instead.
        this.logger.warn(
          `Ranking pass hit the ${RANKING_CANDIDATE_CEILING}-candidate ceiling` +
            ` (user=${userId}, search=${JSON.stringify(search ?? "")},` +
            ` prefilters=${usePrefilters}). Older listed properties are being` +
            ` dropped from the Best Match feed — revisit the read path.`
        );
      }

      const matchResults: PropertyMatchResult[] = candidates.map((property) =>
        this.calculationService.calculateMatch(
          property,
          preferences,
          DEFAULT_WEIGHTS
        )
      );

      // Sort by match percentage (descending)
      matchResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

      ranking = {
        rankedIds: matchResults.map((result) => result.property.id),
        total: matchResults.length,
        // Taken over the whole scored set: the page is a window on this
        // population, not the population itself.
        avgMatchScore: averageMatchPercentage(matchResults),
        expiresAt: Date.now() + MatchingService.RANKING_CACHE_TTL_MS,
      };
      this.setCachedRanking(cacheKey, ranking);
    }

    const total = ranking.total;
    const skip = (page - 1) * limit;
    const pageIds = ranking.rankedIds.slice(skip, skip + limit);

    // Phase 2 — hydrate and score only the page. The relations and the
    // presigned photo URLs are paid for by the rows that are actually
    // returned. Scores and categories are recomputed from the hydrated
    // entities: `calculateMatch` is pure and 6.2 proved the projection ranking
    // identical to full-entity scoring, so on unchanged data this reproduces
    // the cached ranking exactly, and on data edited inside the TTL the page
    // shows the property's CURRENT score rather than a stale one.
    const data = await this.scorePage(pageIds, preferences);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      avgMatchScore: ranking.avgMatchScore,
    };
  }

  /**
   * Hydrate one page of ids and score each row against the user's preferences,
   * preserving the caller's order.
   *
   * This is the single place a returned card gets its badge, whichever path
   * chose the ids — the ranked one or a SQL sort. It uses the same
   * `calculateMatch` + `DEFAULT_WEIGHTS` as `getMatchScores`, so the number on
   * a card is the same number under every sort.
   */
  private async scorePage(
    pageIds: string[],
    preferences: Preferences
  ): Promise<
    Array<{
      property: Property;
      matchScore: number;
      categories: PropertyMatchResult["categories"];
    }>
  > {
    const hydratedById = await this.hydratePropertiesById(pageIds);

    return Promise.all(
      pageIds
        // A property deleted since the ids were chosen drops out rather than
        // being served in a projection-only form, with no relations or photos.
        .filter((id) => hydratedById.has(id))
        .map(async (id) => {
          const property = hydratedById.get(id)!;
          const result = this.calculationService.calculateMatch(
            property,
            preferences,
            DEFAULT_WEIGHTS
          );
          return {
            property: stripOperatorPii(await this.updatePhotosUrls(property)),
            matchScore: result.matchPercentage,
            categories: result.categories,
          };
        })
    );
  }

  /**
   * Load full entities, with their relations, for one page's worth of ids.
   * Returned as a map because the database does not honour the order of an
   * `IN` list and the caller's order is the ranking.
   */
  private async hydratePropertiesById(
    ids: string[]
  ): Promise<Map<string, Property>> {
    if (ids.length === 0) {
      return new Map();
    }

    const properties = await this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.building", "building")
      .leftJoinAndSelect("property.operator", "operator")
      .whereInIds(ids)
      .getMany();

    return new Map(properties.map((property) => [property.id, property]));
  }
}
