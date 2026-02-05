export enum PropertyType {
  Flat = "flat",
  Apartment = "apartment",
  House = "house",
  Room = "room",
  Studio = "studio",
  Penthouse = "penthouse",
}

export enum BuildingType {
  ProfessionalManagement = "professional_management",
  BTR = "btr",
  Luxury = "luxury",
  CoLiving = "co_living",
  StudentAccommodation = "student_accommodation",
  RetirementHome = "retirement_home",
  PrivateLandlord = "private_landlord",
}

export enum Furnishing {
  Furnished = "furnished",
  PartFurnished = "part_furnished",
  Unfurnished = "unfurnished",
  DesignerFurniture = "designer_furniture",
}

export enum LetDuration {
  Any = "any",
  LongTerm = "long_term",
  ShortTerm = "short_term",
  Flexible = "flexible",
}

export enum Bills {
  Included = "included",
  Excluded = "excluded",
}

export interface MetroStation {
  label: string;
  destination: number;
}

export interface CommuteTime {
  label: string;
  destination: number;
}

export interface LocalEssential {
  label: string;
  destination: number;
}

export interface ConciergeHours {
  from: number;
  to: number;
}

export interface Pet {
  type: "dog" | "cat" | "other";
  customType?: string;
  size?: "small" | "medium" | "large";
}

export interface PropertyMedia {
  id: string;
  property_id: string;
  url: string;
  s3_url?: string;
  type: "image" | "video";
  mime_type: string;
  original_filename: string;
  file_size: number;
  order_index: number;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  apartment_number: string;
  title?: string;
  descriptions: string;
  price: number;
  deposit: number;
  available_from: string;
  bills: Bills;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  building_type: BuildingType;
  luxury?: boolean;
  furnishing: Furnishing;
  let_duration: LetDuration;
  floor: number;
  outdoor_space: boolean;
  balcony: boolean;
  terrace: boolean;
  square_meters: number;
  photos: string[];
  media?: PropertyMedia[];
  video?: string;
  documents?: string;
  operator_id: string;
  building_id: string;
  created_at: string;
  updated_at: string;
  // Inherited fields from building
  address?: string;
  tenant_types?: string[];
  amenities?: string[];
  is_concierge?: boolean;
  concierge_hours?: ConciergeHours | null;
  pet_policy?: boolean;
  pets?: Pet[] | null;
  smoking_area?: boolean;
  metro_stations?: MetroStation[];
  commute_times?: CommuteTime[];
  local_essentials?: LocalEssential[];
  building?: {
    id: string;
    name: string;
    address: string;
  };
  operator?: {
    id: string;
    email: string;
    full_name?: string;
  };
}
