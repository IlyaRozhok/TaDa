import { Property } from "../../../entities/property.entity";
import { Preferences } from "../../../entities/preferences.entity";

/**
 * Category weights for matching algorithm
 * Total should equal 100
 */
export interface CategoryWeights {
  budget: number; // Price match
  location: number; // Location, areas, districts, metro proximity
  bedrooms: number; // Bedroom count
  propertyType: number; // Property type match
  availability: number; // Move-in date compatibility
  amenities: number; // Amenities match (including outdoor space)
  bathrooms: number; // Bathroom count
  buildingStyle: number; // Building type
  lifestyle: number; // Lifestyle compatibility (occupation, family status)
  duration: number; // Let duration
  squareMeters: number; // Size preference
  furnishing: number; // Furnishing preference
  smoking: number; // Smoking compatibility
  pets: number; // Pet policy
  bills: number; // Bills included
}

/**
 * Default category weights
 * Optimized based on user priorities and real-world importance
 */
export const DEFAULT_WEIGHTS: CategoryWeights = {
  budget: 20, // Most critical - affordability
  location: 15, // Very important - proximity to work/preferred areas
  bedrooms: 12, // Critical for space needs
  propertyType: 10, // Important property characteristic
  availability: 8, // Important for move-in planning
  amenities: 8, // Important for lifestyle (includes outdoor space)
  bathrooms: 5, // Important but flexible
  buildingStyle: 5, // Preference-based
  lifestyle: 4, // Family/occupation compatibility
  duration: 4, // Contract flexibility
  squareMeters: 3, // Size preference
  furnishing: 2, // Nice to have
  smoking: 2, // Health/lifestyle compatibility
  pets: 1, // Specific need
  bills: 1, // Financial detail
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
  /**
   * Indicates if user has set a preference for this category.
   * If false, this category is excluded from total score calculation.
   */
  hasPreference: boolean;
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
    skipped: number; // Categories with no preference set
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
  /**
   * Minimum match percentage for a property to be visible.
   * Properties below this threshold will be filtered out.
   * Default: 0 (show all)
   */
  minVisibleScore?: number;
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
