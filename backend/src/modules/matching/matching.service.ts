import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, SelectQueryBuilder } from "typeorm";
import { Property } from "@/entities";
import { Preferences } from "@/entities";
import { MatchingCalculationService } from "./services/matching-calculation.service";
import { S3Service } from "@/common/services/s3.service";
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

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Preferences)
    private readonly preferencesRepository: Repository<Preferences>,
    private readonly calculationService: MatchingCalculationService,
    private readonly s3Service: S3Service
  ) {}

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
        .leftJoinAndSelect("property.operator", "operator");

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
          property: await this.updatePhotosUrls(property),
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
      };
    }

    // Phase 1 — rank.
    //
    // By default no SQL pre-filters: we score ALL properties so the "Best Match"
    // sort shows every property ranked by compatibility, not a filtered subset.
    // That is the reason this cannot paginate in SQL, and the reason it selects
    // only the scoring columns: the ranking pass reads the whole table, so it
    // must not also hydrate two joined relations and every unused column for
    // rows that will never be returned.
    const rankingQb = this.propertyRepository
      .createQueryBuilder("property")
      .select(SCORING_COLUMNS.map((column) => `property.${column}`))
      // The sort below is stable, so this decides the order of equal scores.
      // The previous single query had no ORDER BY on this path at all, leaving
      // ties to whatever order the scan happened to produce.
      .orderBy("property.created_at", "DESC");

    if (options.prefilters) {
      this.applyPreFilters(rankingQb, preferences);
    }

    if (search) {
      // A join, not a joinAndSelect: the search predicate reads `building.name`
      // but the ranking pass has no use for the building's columns.
      rankingQb
        .leftJoin("property.building", "building")
        .andWhere(searchPredicate, searchParameters);
    }

    const candidates = await rankingQb.getMany();

    // Score remaining candidates in JS
    const matchResults: PropertyMatchResult[] = candidates.map((property) =>
      this.calculationService.calculateMatch(
        property,
        preferences,
        DEFAULT_WEIGHTS
      )
    );

    // Sort by match percentage (descending)
    matchResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

    const total = matchResults.length;
    const skip = (page - 1) * limit;
    const paginatedResults = matchResults.slice(skip, skip + limit);

    // Phase 2 — hydrate only the page. The relations and the presigned photo
    // URLs are paid for by the rows that are actually returned.
    const pageIds = paginatedResults.map((result) => result.property.id);
    const hydratedById = await this.hydratePropertiesById(pageIds);

    const data = await Promise.all(
      paginatedResults
        // A property deleted between the two queries drops out rather than
        // being served in its ranking-only form, with no relations or photos.
        .filter((result) => hydratedById.has(result.property.id))
        .map(async (result) => ({
          property: await this.updatePhotosUrls(
            hydratedById.get(result.property.id)!,
          ),
          matchScore: result.matchPercentage,
          categories: result.categories,
        }))
    );

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
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
