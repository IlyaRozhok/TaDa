/**
 * Preferences domain types
 */

import { BaseEntity, ID } from './common';
import { PropertyType, Furnishing, LetDuration } from './property';

export interface Preferences extends BaseEntity {
  user_id: ID;
  
  // Location preferences
  primary_postcode?: string;
  secondary_locations?: string[];
  commute_location?: string;
  max_commute_time?: number; // in minutes
  commute_methods?: CommuteMethod[];
  
  // Move-in preferences
  move_in_date?: string;
  flexible_move_in?: boolean;
  
  // Budget
  min_price?: number;
  max_price?: number;
  budget_flexibility?: 'strict' | 'flexible' | 'very_flexible';
  
  // Property specifications
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  min_area?: number;
  max_area?: number;
  
  // Property preferences
  property_types?: PropertyType[];
  furnishing?: Furnishing[];
  let_duration?: LetDuration[];
  
  // Features and amenities
  required_amenities?: string[];
  preferred_amenities?: string[];
  lifestyle_features?: string[];
  convenience_features?: string[];
  
  // Lifestyle
  ideal_living_environment?: string;
  hobbies?: string[];
  work_from_home?: boolean;
  social_preferences?: SocialPreference;
  
  // Policies
  pets?: PetPreference;
  smoking?: boolean;
  
  // Additional requirements
  accessibility_requirements?: string[];
  additional_info?: string;
  
  // Matching preferences
  auto_match?: boolean;
  notification_frequency?: NotificationFrequency;
  max_daily_matches?: number;
}

export enum CommuteMethod {
  Walking = 'walking',
  Cycling = 'cycling',
  PublicTransport = 'public_transport',
  Driving = 'driving',
}

export enum SocialPreference {
  VeryQuiet = 'very_quiet',
  Quiet = 'quiet',
  Moderate = 'moderate',
  Social = 'social',
  VerySocial = 'very_social',
}

export enum NotificationFrequency {
  Immediate = 'immediate',
  Daily = 'daily',
  Weekly = 'weekly',
  Never = 'never',
}

export interface PetPreference {
  has_pets: boolean;
  pet_types?: string[];
  pet_friendly_required?: boolean;
  pet_deposit_acceptable?: boolean;
}

// API DTOs
export interface UpdatePreferencesRequest extends Partial<Omit<Preferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>> {}

export interface PreferencesMatchingResult {
  preferences: Preferences;
  matched_properties: ID[];
  matching_score: number;
  last_updated: string;
}