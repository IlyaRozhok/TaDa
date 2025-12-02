import { Property } from "../../../entities/property.entity";
import { Preferences } from "../../../entities/preferences.entity";

/**
 * Category weights for matching algorithm
 * Total should equal 100
 */
export interface CategoryWeights {
  budget: number;
  availability: number;
  deposit: number;
  propertyType: number;
  bedrooms: number;
  bathrooms: number;
  buildingStyle: number;
  duration: number;
  squareMeters: number;
  bills: number;
  tenantType: number;
  pets: number;
  amenities: number;
  outdoorSpace: number;
  furnishing: number;
  location: number;
}

/**
 * Default category weights
 */
export const DEFAULT_WEIGHTS: CategoryWeights = {
  budget: 20, // Most important - price match
  availability: 10, // Move-in date compatibility
  deposit: 5, // Deposit preference
  propertyType: 8, // Property type match
  bedrooms: 10, // Bedroom count
  bathrooms: 5, // Bathroom count
  buildingStyle: 5, // Building type
  duration: 5, // Let duration
  squareMeters: 5, // Size preference
  bills: 5, // Bills included
  tenantType: 5, // Tenant type compatibility
  pets: 5, // Pet policy
  amenities: 5, // Amenities match
  outdoorSpace: 4, // Outdoor space, balcony, terrace
  furnishing: 2, // Furnishing preference
  location: 1, // Location/metro proximity
};

/**
 * Result for a single matching category
 */
export interface CategoryMatchResult {
  category: string;
  match: boolean;
  score: number;
  maxScore: number;
  reason: string;
  details?: string;
}

/**
 * Complete matching result for a property
 */
export interface PropertyMatchResult {
  property: Property;
  totalScore: number;
  maxPossibleScore: number;
  matchPercentage: number;
  isPerfectMatch: boolean;
  categories: CategoryMatchResult[];
  summary: {
    matched: number;
    partial: number;
    notMatched: number;
  };
}

/**
 * Matching request options
 */
export interface MatchingOptions {
  weights?: Partial<CategoryWeights>;
  minScore?: number;
  limit?: number;
  includePartialMatches?: boolean;
}

/**
 * API response format
 */
export interface MatchingResponse {
  results: PropertyMatchResult[];
  total: number;
  preferences: {
    id: string;
    summary: string;
  };
  appliedWeights: CategoryWeights;
}
