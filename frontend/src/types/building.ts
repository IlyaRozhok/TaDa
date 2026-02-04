/**
 * Building domain types
 */

import { BaseEntity, ID, MediaFile, Address } from './common';

export enum BuildingType {
  ProfessionalManagement = 'professional_management',
  BTR = 'btr',
  Luxury = 'luxury',
  CoLiving = 'co_living',
  StudentAccommodation = 'student_accommodation',
  RetirementHome = 'retirement_home',
  PrivateLandlord = 'private_landlord',
}

export interface Building extends BaseEntity {
  // Basic info
  name: string;
  description?: string;
  building_type: BuildingType;
  
  // Location
  address: string;
  postcode: string;
  city: string;
  country: string;
  
  // Specifications
  number_of_units: number;
  number_of_floors?: number;
  year_built?: number;
  
  // Unit types available in this building
  unit_types: string[]; // ['studio', '1-bed', '2-bed', etc.]
  
  // Amenities and features
  amenities: string[];
  building_features?: string[];
  
  // Transport and location
  metro_stations?: TransportLink[];
  commute_times?: CommuteTime[];
  local_essentials?: LocalEssential[];
  
  // Services
  is_concierge?: boolean;
  concierge_hours?: {
    from: number; // hour in 24h format
    to: number;
  };
  
  // Policies
  pet_policy: boolean;
  pets_allowed?: PetPolicy[];
  smoking_area?: boolean;
  
  // Target demographics
  tenant_types?: string[]; // ['professionals', 'students', 'families', etc.]
  districts?: string[];
  areas?: string[];
  
  // Media
  logo?: string;
  video?: string;
  photos: string[];
  documents?: string;
  virtual_tour_url?: string;
  
  // Relations
  operator_id: ID;
  properties?: ID[]; // Property IDs in this building
  
  // Metadata
  is_featured?: boolean;
  is_verified?: boolean;
}

export interface TransportLink {
  label: string;
  type: 'metro' | 'bus' | 'train' | 'tram';
  distance: number; // in minutes walking
  line?: string; // metro line, bus route, etc.
}

export interface CommuteTime {
  destination: string;
  transport_type: 'walking' | 'cycling' | 'public_transport' | 'driving';
  duration: number; // in minutes
  distance?: number; // in km
}

export interface LocalEssential {
  type: 'supermarket' | 'pharmacy' | 'gym' | 'restaurant' | 'bank' | 'hospital' | 'school';
  name: string;
  distance: number; // in minutes walking
  rating?: number;
}

export interface PetPolicy {
  type: 'dog' | 'cat' | 'bird' | 'fish' | 'other';
  size_limit?: 'small' | 'medium' | 'large' | 'any';
  breed_restrictions?: string[];
  deposit_required?: number;
  monthly_fee?: number;
  max_pets?: number;
}

// API DTOs
export interface CreateBuildingRequest {
  name: string;
  description?: string;
  building_type: BuildingType;
  address: string;
  postcode: string;
  city: string;
  country: string;
  number_of_units: number;
  unit_types: string[];
  amenities: string[];
  pet_policy: boolean;
  operator_id: ID;
}

export interface UpdateBuildingRequest extends Partial<CreateBuildingRequest> {
  is_featured?: boolean;
  is_verified?: boolean;
}