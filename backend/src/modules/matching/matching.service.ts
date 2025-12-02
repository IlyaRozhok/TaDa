import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";
import { MatchingCalculationService } from "./services/matching-calculation.service";
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
    private readonly calculationService: MatchingCalculationService
  ) {}

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
    } = options;

    // Merge custom weights with defaults
    const appliedWeights: CategoryWeights = {
      ...DEFAULT_WEIGHTS,
      ...weights,
    };

    // Calculate match for each property
    const results: PropertyMatchResult[] = properties.map((property) =>
      this.calculationService.calculateMatch(property, preferences, appliedWeights)
    );

    // Filter by minimum score
    let filteredResults = results.filter((r) => r.matchPercentage >= minScore);

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

    return this.calculationService.calculateMatch(property, preferences, DEFAULT_WEIGHTS);
  }

  /**
   * Get top matches (simplified response for cards)
   */
  async getTopMatches(
    userId: string,
    limit: number = 20
  ): Promise<{
    property: Property;
    matchScore: number;
    matchReasons: string[];
    perfectMatch: boolean;
  }[]> {
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
  ): Promise<{
    property: Property;
    matchScore: number;
    matchReasons: string[];
    perfectMatch: boolean;
    categories: {
      category: string;
      match: boolean;
      score: number;
      maxScore: number;
      reason: string;
      details?: string;
    }[];
  }[]> {
    const response = await this.getMatchesForUser(userId, { limit });

    return response.results.map((result) => ({
      property: result.property,
      matchScore: result.matchPercentage,
      matchReasons: result.categories
        .filter((c) => c.match)
        .map((c) => c.reason),
      perfectMatch: result.isPerfectMatch,
      categories: result.categories,
    }));
  }

  /**
   * Generate a human-readable summary of preferences
   */
  private generatePreferencesSummary(preferences: Preferences): string {
    const parts: string[] = [];

    if (preferences.min_price || preferences.max_price) {
      parts.push(`Budget: £${preferences.min_price || 0}-£${preferences.max_price || "∞"}`);
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

