/**
 * Property domain types
 */

import { BaseEntity, ID, MediaFile, Address, Coordinates } from './common';

export enum PropertyType {
  Flat = 'flat',
  Apartment = 'apartment',
  House = 'house',
  Room = 'room',
  Studio = 'studio',
  Penthouse = 'penthouse',
}

export enum PropertyStatus {
  Available = 'available',
  Rented = 'rented',
  Maintenance = 'maintenance',
  Draft = 'draft',
  Archived = 'archived',
}

export enum Furnishing {
  Furnished = 'furnished',
  PartFurnished = 'part_furnished',
  Unfurnished = 'unfurnished',
  DesignerFurniture = 'designer_furniture',
}

export enum LetDuration {
  Any = 'any',
  LongTerm = 'long_term',
  ShortTerm = 'short_term',
  Flexible = 'flexible',
}

export enum Bills {
  Included = 'included',
  Excluded = 'excluded',
  PartIncluded = 'part_included',
}

export interface Property extends BaseEntity {
  // Basic info
  title: string;
  description?: string;
  property_type: PropertyType;
  status: PropertyStatus;
  
  // Location
  address: string;
  postcode: string;
  city: string;
  country: string;
  coordinates?: Coordinates;
  
  // Specifications
  bedrooms: number;
  bathrooms: number;
  area?: number; // in square meters
  floor?: number;
  total_floors?: number;
  
  // Financial
  price: number; // monthly rent
  deposit?: number;
  bills: Bills;
  council_tax_included?: boolean;
  
  // Features
  furnishing: Furnishing;
  let_duration: LetDuration;
  available_from?: string;
  minimum_stay?: number; // in months
  maximum_stay?: number; // in months
  
  // Amenities and features
  amenities: string[];
  lifestyle_features?: string[];
  convenience_features?: string[];
  
  // Media
  media: PropertyMedia[];
  featured_image?: string;
  virtual_tour_url?: string;
  
  // Relations
  operator_id: ID;
  building_id?: ID;
  
  // Metadata
  views_count?: number;
  is_featured?: boolean;
  is_verified?: boolean;
  last_updated_by?: ID;
}

export interface PropertyMedia extends MediaFile {
  property_id: ID;
  is_featured?: boolean;
  room_type?: string; // 'bedroom', 'bathroom', 'kitchen', 'living_room', etc.
}

export interface PropertySearchFilters {
  // Location
  postcode?: string;
  city?: string;
  coordinates?: Coordinates;
  radius?: number; // in km
  
  // Price
  min_price?: number;
  max_price?: number;
  
  // Specifications
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  min_area?: number;
  max_area?: number;
  
  // Features
  property_types?: PropertyType[];
  furnishing?: Furnishing[];
  let_duration?: LetDuration[];
  bills?: Bills[];
  
  // Amenities
  required_amenities?: string[];
  
  // Availability
  available_from?: string;
  min_stay?: number;
  max_stay?: number;
  
  // Other
  is_featured?: boolean;
  is_verified?: boolean;
}

// API DTOs
export interface CreatePropertyRequest {
  title: string;
  description?: string;
  property_type: PropertyType;
  address: string;
  postcode: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  price: number;
  deposit?: number;
  bills: Bills;
  furnishing: Furnishing;
  let_duration: LetDuration;
  available_from?: string;
  amenities: string[];
  building_id?: ID;
}

export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {
  status?: PropertyStatus;
  is_featured?: boolean;
}

export interface PropertyListResponse {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
  filters?: PropertySearchFilters;
}