import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, SelectQueryBuilder } from "typeorm";
import { Property } from "@/entities";
import { Preferences } from "@/entities";
import { PropertyStatus } from "@/entities/property.entity";
import { MatchingCalculationService } from "./services/matching-calculation.service";
import { S3Service } from "@/common/services/s3.service";
import { stripOperatorPii } from "@/common/mappers/public-operator.mapper";
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
 * `address` and `metro_stations` are read by `matchLocation`, which is
 * currently unreachable — `calculateMatch` pushes seventeen categories and
 * location is not one of them. They are kept in the projection anyway, so that
 * wiring location back in (6.3) does not silently score every property as
 * having no location data.
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
  "building_type",
  "children",
  "furnishing",
  "let_duration",
  "metro_stations",
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
   * The single read path for matched properties: the whole inventory ranked by
   * match score, paginated and searchable. Every screen that shows matched
   * listings reads it from here.
   *
   * `options.prefilters` narrows the candidate set in SQL first — see
   * `applyPreFilters`. Off by default; it exists so the behaviour of the
   * deleted `/matches` route stays reachable rather than being dropped.
   */
  async getMatchedPropertiesWithPagination(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      prefilters?: boolean;
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
     * `total` counts, not the page in `data`. Sort- and page-independent: it is
     * a property of this tenant and these filters, so every consumer of the
     * feed can report it beside `total` and describe one population with both.
     */
    avgMatchScore: number | null;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 12;
    const search = options.search?.trim();

    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    // One predicate, used by both read paths below. It reads `building.name`,
    // so any query applying it has to join the building.
    const searchPredicate =
      "(property.apartment_number ILIKE :search OR property.title ILIKE :search OR building.name ILIKE :search OR property.id::text ILIKE :search)";
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

      const properties = await qb
        .orderBy("property.created_at", "DESC")
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

    // SQL pre-filters are ON by default since the 2026-08-21 hardening batch:
    // the generous ranges in `applyPreFilters` only drop rows that could never
    // rank, and narrowing in SQL is half of what keeps this path from scoring
    // the whole table per request. `?prefilters=false` restores the old
    // rank-everything behaviour.
    const usePrefilters = options.prefilters ?? true;

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

    // Phase 2 — hydrate only the page. The relations and the presigned photo
    // URLs are paid for by the rows that are actually returned. Scores and
    // categories for the page are recomputed from the hydrated entities:
    // `calculateMatch` is pure and 6.2 proved the projection ranking identical
    // to full-entity scoring, so on unchanged data this reproduces the cached
    // ranking exactly, and on data edited inside the TTL the page shows the
    // property's CURRENT score rather than a stale one.
    const hydratedById = await this.hydratePropertiesById(pageIds);

    const data = await Promise.all(
      pageIds
        // A property deleted since the ranking pass drops out rather than
        // being served in a ranking-only form, with no relations or photos.
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

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      avgMatchScore: ranking.avgMatchScore,
    };
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
