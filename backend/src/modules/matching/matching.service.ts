import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { MatchingCalculationService } from "./services/matching-calculation.service";
import { S3Service } from "../../common/services/s3.service";
import {
  PropertyMatchResult,
  MatchingOptions,
  MatchingResponse,
  CategoryWeights,
  DEFAULT_WEIGHTS,
} from "./interfaces/matching.interfaces";

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
   * Build a query with SQL pre-filters based on user preferences.
   * Uses generous ranges so partial matches are NOT excluded — the JS
   * scoring engine handles exact scoring and partial credit.
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
   * Get matched properties for a user
   */
  async getMatchesForUser(
    userId: string,
    options: MatchingOptions = {}
  ): Promise<MatchingResponse> {
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      throw new NotFoundException("User preferences not found");
    }

    // Pre-filter in SQL, then score in JS
    const qb = this.propertyRepository
      .createQueryBuilder("property")
      .orderBy("property.created_at", "DESC");

    this.applyPreFilters(qb, preferences);

    const properties = await qb.getMany();

    return this.calculateMatches(properties, preferences, options);
  }

  /**
   * Calculate matches for given properties and preferences
   */
  async calculateMatches(
    properties: Property[],
    preferences: Preferences,
    options: MatchingOptions = {}
  ): Promise<MatchingResponse> {
    const {
      weights = {},
      minScore = 0,
      limit = 50,
      includePartialMatches = true,
      minVisibleScore = 0,
    } = options;

    const appliedWeights: CategoryWeights = {
      ...DEFAULT_WEIGHTS,
      ...weights,
    };

    // Calculate match for each property
    const results: PropertyMatchResult[] = properties.map((property) =>
      this.calculationService.calculateMatch(
        property,
        preferences,
        appliedWeights
      )
    );

    // Filter by minimum score
    let filteredResults = results.filter((r) => r.matchPercentage >= minScore);

    if (minVisibleScore > 0) {
      filteredResults = filteredResults.filter(
        (r) => r.matchPercentage >= minVisibleScore
      );
    }

    if (!includePartialMatches) {
      filteredResults = filteredResults.filter((r) => r.isPerfectMatch);
    }

    // Sort by match percentage (descending)
    filteredResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

    const limitedResults = filteredResults.slice(0, limit);

    const summary = this.generatePreferencesSummary(preferences);

    return {
      results: limitedResults,
      total: filteredResults.length,
      preferences: {
        id: preferences.id,
        summary,
      },
      appliedWeights,
    };
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
   * Get top matches (simplified response for cards)
   */
  async getTopMatches(
    userId: string,
    limit: number = 20
  ): Promise<
    {
      property: Property;
      matchScore: number;
      matchReasons: string[];
      perfectMatch: boolean;
    }[]
  > {
    const response = await this.getMatchesForUser(userId, { limit });

    return response.results.map((result) => ({
      property: result.property,
      matchScore: result.matchPercentage,
      matchReasons: result.categories
        .filter((c) => c.match)
        .map((c) => c.reason),
      perfectMatch: result.isPerfectMatch,
    }));
  }

  /**
   * Get detailed matches with full category breakdown
   */
  async getDetailedMatches(
    userId: string,
    limit: number = 20
  ): Promise<
    {
      property: Property;
      matchScore: number;
      matchPercentage: number;
      matchReasons: string[];
      perfectMatch: boolean;
      categories: {
        category: string;
        match: boolean;
        score: number;
        maxScore: number;
        reason: string;
        details?: string;
        hasPreference: boolean;
      }[];
    }[]
  > {
    const response = await this.getMatchesForUser(userId, { limit });

    return Promise.all(
      response.results.map(async (result) => ({
        property: await this.updatePhotosUrls(result.property),
        matchScore: result.matchPercentage,
        matchPercentage: result.matchPercentage,
        matchReasons: result.categories
          .filter((c) => c.match)
          .map((c) => c.reason),
        perfectMatch: result.isPerfectMatch,
        categories: result.categories,
      }))
    );
  }

  /**
   * Get matched properties with pagination and search.
   * SQL pre-filters eliminate obviously non-matching properties before
   * the JS scoring engine runs, avoiding loading ALL properties into memory.
   */
  async getMatchedPropertiesWithPagination(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
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

    // Build base query with joins
    const qb = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.building", "building")
      .leftJoinAndSelect("property.operator", "operator");

    if (search) {
      const searchPattern = `%${search}%`;
      qb.andWhere(
        "(property.apartment_number ILIKE :search OR property.title ILIKE :search OR building.name ILIKE :search OR property.id::text ILIKE :search)",
        { search: searchPattern },
      );
    }

    if (!preferences) {
      // No preferences — use DB-level pagination (no scoring needed)
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

    // Apply SQL pre-filters to narrow the candidate set
    this.applyPreFilters(qb, preferences);

    const candidates = await qb.getMany();

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

    const data = await Promise.all(
      paginatedResults.map(async (result) => ({
        property: await this.updatePhotosUrls(result.property),
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
   * Generate a human-readable summary of preferences
   */
  private generatePreferencesSummary(preferences: Preferences): string {
    const parts: string[] = [];

    if (preferences.min_price || preferences.max_price) {
      parts.push(
        `Budget: £${preferences.min_price || 0}-£${
          preferences.max_price || "∞"
        }`
      );
    }

    if (preferences.bedrooms?.length) {
      parts.push(`${preferences.bedrooms.join("/")} bed`);
    }

    if (preferences.property_types?.length) {
      parts.push(preferences.property_types.join("/"));
    }

    if (preferences.pet_policy) {
      parts.push("Pet-friendly");
    }

    return parts.length > 0 ? parts.join(" • ") : "No preferences set";
  }
}
