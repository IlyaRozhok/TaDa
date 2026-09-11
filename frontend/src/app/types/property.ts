/**
 * Listing lifecycle, mirroring the backend's `PropertyStatus` enum. The
 * booking pipeline drives `listed → under_offer → let` automatically;
 * admins/operators set the rest by hand.
 */
export type PropertyStatus =
  | "draft"
  | "listed"
  | "under_offer"
  | "let"
  | "archived";

export const PROPERTY_STATUS_VALUES: PropertyStatus[] = [
  "draft",
  "listed",
  "under_offer",
  "let",
  "archived",
];

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: "Draft",
  listed: "Listed",
  under_offer: "Under offer",
  let: "Let",
  archived: "Archived",
};

/** EPC bands, mirroring the backend's `EPC_RATING_VALUES` vocabulary. */
export const EPC_RATING_VALUES = ["A", "B", "C", "D", "E", "F", "G"] as const;

export enum PropertyType {
  Flat = "flat",
  Apartment = "apartment",
  House = "house",
  Room = "room",
  Studio = "studio",
  Penthouse = "penthouse",
  Maisonette = "maisonette",
}

export enum BuildingType {
  ProfessionalManagement = "professional_management",
  BTR = "btr",
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
  ShortTerm = "short_term",
  MediumTerm = "medium_term",
  LongTerm = "long_term",
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
  /** Optional optimized variants; nullable columns on the media entity. */
  thumbnail_url?: string | null;
  medium_url?: string | null;
  type: "image" | "video";
  mime_type: string;
  original_filename: string;
  file_size: number;
  order_index: number;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * The one Property type, shaped by what the API actually sends. Two routes
 * serve it: the admin routes answer with the full entity, the public routes
 * with the narrower PublicPropertyResponse projection — so entity fields the
 * projection omits are optional here, and nullable columns admit null.
 * Decimal columns (price, deposit, square_meters) arrive as strings from
 * TypeORM on the admin routes; the data layer normalises them to numbers
 * (see store/api/properties.api.ts), so they are numbers here.
 */
export interface Property {
  id: string;
  /** Lifecycle status. Optional: cached rows may predate the column. */
  status?: PropertyStatus;
  /** EPC band (A-G), legally required on listing advertisements. */
  epc_rating?: string | null;
  /**
   * Tenant Fees Act 2019 flag from the public projection: the deposit
   * exceeds 5 weeks' rent (6 at £50k+ annual). Absent on admin routes,
   * which return the raw entity — the admin form recomputes it itself.
   */
  deposit_exceeds_cap?: boolean | null;
  title: string | null;
  descriptions: string | null;
  address: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  photos: string[];
  building_type: BuildingType | null;
  property_type: PropertyType | null;
  furnishing: Furnishing | null;
  available_from: string | null;
  created_at: string;
  operator_id: string | null;
  /** Featured in the landings' listings section. Only an admin may set it. */
  is_landing_listing?: boolean;
  amenities?: string[];
  property_amenities?: string[];
  deposit?: number | null;
  bills?: Bills | null;
  // Entity fields the public projection does not expose
  apartment_number?: string | null;
  building_id?: string | null;
  let_duration?: LetDuration | null;
  floor?: number | null;
  balcony?: boolean;
  terrace?: boolean;
  media?: PropertyMedia[];
  video?: string | null;
  documents?: string | null;
  updated_at?: string;
  tenant_types?: string[];
  family_status?: string[];
  occupation?: string[];
  children?: string[];
  pet_policy?: boolean | null;
  pets?: Pet[] | null;
  metro_stations?: MetroStation[];
  commute_times?: CommuteTime[];
  local_essentials?: LocalEssential[];
  building?: {
    id: string;
    name: string;
    address?: string | null;
    logo?: string | null;
  } | null;
  operator?: {
    id: string;
    email: string;
    full_name?: string;
  };
}
