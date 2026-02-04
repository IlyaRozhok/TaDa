import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly calculationService: MatchingCalculationService,
    private readonly s3Service: S3Service
  ) {}

  /**
   * Update photos URLs with fresh presigned URLs
   */
  private async updatePhotosUrls(property: Property): Promise<Property> {
    if (!property.photos || property.photos.length === 0) {
      return property;
    }

    const updatedPhotos = await Promise.all(
      property.photos.map(async (photoUrl) => {
        try {
          // Extract S3 key from URL
          const s3Key = this.extractS3KeyFromUrl(photoUrl);
          if (s3Key) {
            // Generate fresh presigned URL
            return await this.s3Service.getPresignedUrl(s3Key);
          }
          return photoUrl; // Return original if can't extract key
        } catch (error) {
          console.error(`Failed to update photo URL: ${photoUrl}`, error);
          return photoUrl; // Return original on error
        }
      })
    );

    return { ...property, photos: updatedPhotos };
  }

  /**
   * Extract S3 key from S3 URL
   */
  private extractS3KeyFromUrl(url: string): string | null {
    try {
      // Handle both old and new bucket URLs
      const patterns = [
        /https:\/\/tada-prod-media\.s3\.eu-west-2\.amazonaws\.com\/([^?]+)/,
        /https:\/\/tada-media-bucket-local\.s3\.eu-north-1\.amazonaws\.com\/([^?]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return decodeURIComponent(match[1]);
        }
      }

      return null;
    } catch (error) {
      console.error("Error extracting S3 key from URL:", url, error);
      return null;
    }
  }

  /**
   * Get matched properties for a user
   */
  async getMatchesForUser(
    userId: string,
    options: MatchingOptions = {}
  ): Promise<MatchingResponse> {
    // Get user preferences
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      throw new NotFoundException("User preferences not found");
    }

    // Get all available properties
    const properties = await this.propertyRepository.find({
      order: { created_at: "DESC" },
    });

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
      minVisibleScore = 0, // Default: show all properties
    } = options;

    // Merge custom weights with defaults
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

    // Filter by minimum visible score threshold
    // Properties below this threshold are hidden from results
    if (minVisibleScore > 0) {
      filteredResults = filteredResults.filter(
        (r) => r.matchPercentage >= minVisibleScore
      );
    }

    // Optionally filter out partial matches
    if (!includePartialMatches) {
      filteredResults = filteredResults.filter((r) => r.isPerfectMatch);
    }

    // Sort by match percentage (descending)
    filteredResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Apply limit
    const limitedResults = filteredResults.slice(0, limit);

    // Generate preferences summary
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
      matchPercentage: number; // For consistency with API
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
        matchScore: result.matchPercentage, // Legacy field
        matchPercentage: result.matchPercentage, // New field
        matchReasons: result.categories
          .filter((c) => c.match)
          .map((c) => c.reason),
        perfectMatch: result.isPerfectMatch,
        categories: result.categories,
      }))
    );
  }

  /**
   * Get matched properties with pagination and search
   * This method calculates matching scores for all properties, then applies pagination
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

    // Get user preferences
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      throw new NotFoundException("User preferences not found");
    }

    // Build query for properties with search
    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.building", "building")
      .leftJoinAndSelect("property.operator", "operator");

    if (search) {
      const searchPattern = `%${search}%`;
      queryBuilder.andWhere(
        "(property.apartment_number ILIKE :search OR property.title ILIKE :search OR building.name ILIKE :search)",
        { search: searchPattern }
      );
    }

    // Get all properties matching search (before pagination)
    const allProperties = await queryBuilder.getMany();

    // Calculate matches for all properties
    const matchResults: PropertyMatchResult[] = allProperties.map((property) =>
      this.calculationService.calculateMatch(
        property,
        preferences,
        DEFAULT_WEIGHTS
      )
    );

    // Sort by match percentage (descending)
    matchResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Apply pagination after sorting
    const total = matchResults.length;
    const skip = (page - 1) * limit;
    const paginatedResults = matchResults.slice(skip, skip + limit);

    // Transform to response format and update photo URLs
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
