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
  propertyAmenities: number; // Apartment-level features match
  occupation: number; // Occupation compatibility with tenant types
  familyStatus: number; // Family status compatibility
  children: number; // Children compatibility with property
  bathrooms: number; // Bathroom count
  buildingStyle: number; // Building type
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
 * Enhanced lifestyle factors (occupation, family status, children) now total 15 points
 */
export const DEFAULT_WEIGHTS: CategoryWeights = {
  budget: 18, // Most critical - affordability (reduced from 20)
  location: 15, // Very important - proximity to work/preferred areas
  bedrooms: 12, // Critical for space needs
  propertyType: 10, // Important property characteristic
  availability: 8, // Important for move-in planning
  amenities: 8, // Important for lifestyle (includes outdoor space)
  propertyAmenities: 5, // Apartment-level features (kitchen, bathroom, storage, tech, access)
  occupation: 6, // NEW - Occupation compatibility with tenant types
  familyStatus: 5, // NEW - Family status compatibility  
  children: 4, // NEW - Children compatibility with property
  bathrooms: 4, // Important but flexible (reduced from 5)
  buildingStyle: 4, // Preference-based (reduced from 5)
  duration: 3, // Contract flexibility (reduced from 4)
  squareMeters: 2, // Size preference (reduced from 3)
  furnishing: 1, // Nice to have (reduced from 2)
  smoking: 1, // Health/lifestyle compatibility (reduced from 2)
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
