import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Property } from "../../entities/property.entity";
import { Preferences } from "../../entities/preferences.entity";
import { User } from "../../entities/user.entity";

export interface MatchingResult {
  property: Property;
  matchScore: number;
  matchReasons: string[];
}

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Preferences)
    private readonly preferencesRepository: Repository<Preferences>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  /**
   * Find properties that match user preferences based on the specified rules:
   * - Property price within min_price and max_price
   * - Property bedrooms ≥ user preferred bedrooms
   * - Property type matches user's selection
   * - lifestyle_features must intersect with user preferences
   */
  async findMatchedProperties(
    userId: string,
    limit: number = 20
  ): Promise<Property[]> {
    // Get user preferences
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      // If no preferences set, return featured properties
      return await this.propertyRepository.find({
        relations: ["operator"],
        order: { created_at: "DESC" },
        take: limit,
      });
    }

    // Build query with filters
    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.operator", "operator");

    // Rule 1: Property price within min_price and max_price
    if (preferences.min_price !== null && preferences.min_price > 0) {
      queryBuilder.andWhere("property.price >= :minPrice", {
        minPrice: preferences.min_price,
      });
    }

    if (preferences.max_price !== null && preferences.max_price > 0) {
      queryBuilder.andWhere("property.price <= :maxPrice", {
        maxPrice: preferences.max_price,
      });
    }

    // Rule 2: Property bedrooms ≥ user preferred minimum bedrooms
    if (preferences.min_bedrooms !== null && preferences.min_bedrooms > 0) {
      queryBuilder.andWhere("property.bedrooms >= :minBedrooms", {
        minBedrooms: preferences.min_bedrooms,
      });
    }

    // Optional: Property bedrooms ≤ user preferred maximum bedrooms
    if (preferences.max_bedrooms !== null && preferences.max_bedrooms > 0) {
      queryBuilder.andWhere("property.bedrooms <= :maxBedrooms", {
        maxBedrooms: preferences.max_bedrooms,
      });
    }

    // Rule 3: Property type matches user's selection
    if (preferences.property_type && preferences.property_type !== "any") {
      queryBuilder.andWhere(
        "LOWER(property.property_type) = LOWER(:propertyType)",
        {
          propertyType: preferences.property_type,
        }
      );
    }

    // Furnishing preference
    if (preferences.furnishing && preferences.furnishing !== "any") {
      queryBuilder.andWhere("LOWER(property.furnishing) = LOWER(:furnishing)", {
        furnishing: preferences.furnishing,
      });
    }

    // Get all properties that match basic criteria
    let matchingProperties = await queryBuilder
      .orderBy("property.created_at", "DESC")
      .getMany();

    // Rule 4: lifestyle_features must intersect with user preferences
    // Apply lifestyle features filtering
    matchingProperties = this.filterByLifestyleFeatures(
      matchingProperties,
      preferences
    );

    // Sort by match score (properties with more matching features first)
    const scoredProperties = matchingProperties.map((property) => ({
      property,
      score: this.calculateMatchScore(property, preferences),
    }));

    scoredProperties.sort((a, b) => b.score - a.score);

    return scoredProperties.slice(0, limit).map((scored) => scored.property);
  }

  /**
   * Filter properties by lifestyle features intersection
   */
  private filterByLifestyleFeatures(
    properties: Property[],
    preferences: Preferences
  ): Property[] {
    // Collect all user lifestyle preferences
    const userFeatures = new Set<string>();

    if (preferences.lifestyle_features) {
      preferences.lifestyle_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.social_features) {
      preferences.social_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.work_features) {
      preferences.work_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.convenience_features) {
      preferences.convenience_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.pet_friendly_features) {
      preferences.pet_friendly_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.luxury_features) {
      preferences.luxury_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }

    // If user has no lifestyle preferences, return all properties
    if (userFeatures.size === 0) {
      return properties;
    }

    // Filter properties that have at least one matching lifestyle feature
    return properties.filter((property) => {
      if (
        !property.lifestyle_features ||
        property.lifestyle_features.length === 0
      ) {
        return false; // Property has no features, can't match
      }

      // Check if there's any intersection between property and user features
      const propertyFeatures = property.lifestyle_features.map((f) =>
        f.toLowerCase()
      );
      return propertyFeatures.some((feature) => userFeatures.has(feature));
    });
  }

  /**
   * Calculate match score for sorting (normalized to 0-100)
   */
  private calculateMatchScore(
    property: Property,
    preferences: Preferences
  ): number {
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Price match (weight: 25%)
    if (preferences.min_price && preferences.max_price) {
      const priceRange = preferences.max_price - preferences.min_price;
      const idealPrice = preferences.min_price + priceRange * 0.3; // Prefer lower end
      const priceDiff = Math.abs(property.price - idealPrice);
      const priceScore = Math.max(0, 100 - (priceDiff / priceRange) * 100);
      totalScore += priceScore * 0.25;
      maxPossibleScore += 100 * 0.25;
    }

    // Bedroom match (weight: 20%)
    if (preferences.min_bedrooms) {
      let bedroomScore = 0;
      if (property.bedrooms >= preferences.min_bedrooms) {
        bedroomScore = 60; // Base match score
        if (
          preferences.max_bedrooms &&
          property.bedrooms <= preferences.max_bedrooms
        ) {
          bedroomScore = 100; // Perfect range match
        } else if (property.bedrooms === preferences.min_bedrooms) {
          bedroomScore = 100; // Exact minimum match
        }
      }
      totalScore += bedroomScore * 0.2;
      maxPossibleScore += 100 * 0.2;
    }

    // Property type match (weight: 20%)
    if (preferences.property_type && preferences.property_type !== "any") {
      const typeScore =
        property.property_type.toLowerCase() ===
        preferences.property_type.toLowerCase()
          ? 100
          : 0;
      totalScore += typeScore * 0.2;
      maxPossibleScore += 100 * 0.2;
    }

    // Furnishing match (weight: 15%)
    if (preferences.furnishing && preferences.furnishing !== "any") {
      const furnishingScore =
        property.furnishing.toLowerCase() ===
        preferences.furnishing.toLowerCase()
          ? 100
          : 0;
      totalScore += furnishingScore * 0.15;
      maxPossibleScore += 100 * 0.15;
    }

    // Lifestyle features match (weight: 20%)
    const lifestyleScore = this.calculateLifestyleFeaturesScore(
      property,
      preferences
    );
    totalScore += lifestyleScore * 0.2;
    maxPossibleScore += 100 * 0.2;

    // Normalize to 0-100 scale
    if (maxPossibleScore === 0) {
      return 0;
    }

    const normalizedScore = (totalScore / maxPossibleScore) * 100;
    return Math.min(100, Math.max(0, normalizedScore));
  }

  /**
   * Calculate lifestyle features matching score
   */
  private calculateLifestyleFeaturesScore(
    property: Property,
    preferences: Preferences
  ): number {
    if (
      !property.lifestyle_features ||
      property.lifestyle_features.length === 0
    ) {
      return 0;
    }

    // Collect all user lifestyle preferences
    const userFeatures = new Set<string>();

    if (preferences.lifestyle_features) {
      preferences.lifestyle_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.social_features) {
      preferences.social_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.work_features) {
      preferences.work_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.convenience_features) {
      preferences.convenience_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.pet_friendly_features) {
      preferences.pet_friendly_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.luxury_features) {
      preferences.luxury_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }

    if (userFeatures.size === 0) {
      return 0;
    }

    // Count matching features
    const propertyFeatures = property.lifestyle_features.map((f) =>
      f.toLowerCase()
    );
    const matchingFeatures = propertyFeatures.filter((feature) =>
      userFeatures.has(feature)
    );

    // Calculate score based on percentage of user preferences matched
    const matchPercentage = matchingFeatures.length / userFeatures.size;
    return matchPercentage * 100;
  }

  /**
   * Get detailed matching results with scores and reasons
   */
  async getDetailedMatches(
    userId: string,
    limit: number = 10
  ): Promise<MatchingResult[]> {
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      const properties = await this.propertyRepository.find({
        relations: ["operator"],
        order: { created_at: "DESC" },
        take: limit,
      });

      return properties.map((property) => ({
        property,
        matchScore: 0,
        matchReasons: ["No preferences set"],
      }));
    }

    const properties = await this.findMatchedProperties(userId, limit * 2); // Get more to score them

    return properties.slice(0, limit).map((property) => {
      const score = this.calculateMatchScore(property, preferences);
      const reasons = this.getMatchReasons(property, preferences);

      return {
        property,
        matchScore: Math.round(score),
        matchReasons: reasons,
      };
    });
  }

  /**
   * Get human-readable match reasons
   */
  private getMatchReasons(
    property: Property,
    preferences: Preferences
  ): string[] {
    const reasons: string[] = [];

    // Price match
    if (preferences.min_price && preferences.max_price) {
      if (
        property.price >= preferences.min_price &&
        property.price <= preferences.max_price
      ) {
        reasons.push(
          `Price £${property.price} within budget £${preferences.min_price}-£${preferences.max_price}`
        );
      }
    }

    // Bedroom match
    if (
      preferences.min_bedrooms &&
      property.bedrooms >= preferences.min_bedrooms
    ) {
      reasons.push(
        `${property.bedrooms} bedrooms meets requirement (${preferences.min_bedrooms}+ needed)`
      );
    }

    // Property type match
    if (
      preferences.property_type &&
      preferences.property_type !== "any" &&
      property.property_type.toLowerCase() ===
        preferences.property_type.toLowerCase()
    ) {
      reasons.push(
        `Property type "${property.property_type}" matches preference`
      );
    }

    // Furnishing match
    if (
      preferences.furnishing &&
      preferences.furnishing !== "any" &&
      property.furnishing.toLowerCase() === preferences.furnishing.toLowerCase()
    ) {
      reasons.push(`${property.furnishing} furnishing matches preference`);
    }

    // Lifestyle features
    const matchingFeatures = this.getMatchingLifestyleFeatures(
      property,
      preferences
    );
    if (matchingFeatures.length > 0) {
      reasons.push(
        `${matchingFeatures.length} matching lifestyle features: ${matchingFeatures.slice(0, 3).join(", ")}${matchingFeatures.length > 3 ? "..." : ""}`
      );
    }

    return reasons;
  }

  /**
   * Get matching lifestyle features
   */
  private getMatchingLifestyleFeatures(
    property: Property,
    preferences: Preferences
  ): string[] {
    if (
      !property.lifestyle_features ||
      property.lifestyle_features.length === 0
    ) {
      return [];
    }

    // Collect all user lifestyle preferences
    const userFeatures = new Set<string>();

    if (preferences.lifestyle_features) {
      preferences.lifestyle_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.social_features) {
      preferences.social_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.work_features) {
      preferences.work_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.convenience_features) {
      preferences.convenience_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.pet_friendly_features) {
      preferences.pet_friendly_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }
    if (preferences.luxury_features) {
      preferences.luxury_features.forEach((feature) =>
        userFeatures.add(feature.toLowerCase())
      );
    }

    // Find matching features
    const propertyFeatures = property.lifestyle_features.map((f) =>
      f.toLowerCase()
    );
    return propertyFeatures.filter((feature) => userFeatures.has(feature));
  }
}
