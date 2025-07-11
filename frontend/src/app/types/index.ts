export enum PropertyType {
  APARTMENT = "APARTMENT",
  HOUSE = "HOUSE",
  ROOM = "ROOM",
}

export enum PropertyStatus {
  AVAILABLE = "AVAILABLE",
  RENTED = "RENTED",
  UNAVAILABLE = "UNAVAILABLE",
}

export enum WorkStyle {
  OFFICE = "OFFICE",
  HYBRID = "HYBRID",
  REMOTE = "REMOTE",
}

export interface Property {
  id: string;
  title: string;
  description: string;
  address?: string;
  property_type?: string;
  furnishing?: string;
  lifestyle_features?: string[];
  available_from?: string;
  is_btr?: boolean;
  type?: PropertyType;
  status?: PropertyStatus;
  price: number;
  bedrooms: number;
  bathrooms: number;
  total_area?: number;
  living_area?: number;
  floor?: number;
  total_floors?: number;
  year_built?: number;
  has_elevator?: boolean;
  has_parking?: boolean;
  pets_allowed?: boolean;
  work_style_match?: WorkStyle;
  additional_requirements?: string;
  created_at: string;
  updated_at: string;
  operator_id: string;
  // Media files from S3
  media?: PropertyMedia[];
  // Deprecated: will be removed in favor of media
  images?: string[];
}

export interface PropertyMedia {
  id: string;
  property_id: string;
  url: string;
  type: "image" | "video";
  mime_type: string;
  original_filename: string;
  file_size: number;
  order_index: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadResponse {
  url: string;
  key: string;
  message?: string;
}
 