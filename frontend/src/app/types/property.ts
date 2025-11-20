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

export interface Property {
  id: string;
  apartment_number: string;
  descriptions: string;
  price: number;
  deposit: number;
  available_from: string;
  bills: Bills;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  building_type: BuildingType;
  furnishing: Furnishing;
  let_duration: LetDuration;
  floor: number;
  outdoor_space: boolean;
  balcony: boolean;
  terrace: boolean;
  square_meters: number;
  photos: string[];
  video?: string;
  documents?: string;
  operator_id: string;
  building_id: string;
  created_at: string;
  updated_at: string;
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
