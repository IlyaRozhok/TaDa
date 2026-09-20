import type { Building as ApiBuilding } from "@/store/api/buildings.api";
import type {
  Bills,
  BuildingType,
  Furnishing,
  PropertyType,
} from "@/app/types/property";
import type { AdminUser } from "@/store/api/users.api";

export interface Pet {
  type: "dog" | "cat" | "other";
  customType?: string;
  size?: "small" | "medium" | "large";
}

export interface MetroStation {
  label: string;
  destination?: number;
}

export interface CommuteTime {
  label: string;
  destination?: number;
}

export interface LocalEssential {
  label: string;
  destination?: number;
}

export interface ConciergeHours {
  from?: number;
  to?: number;
}

/** The building exactly as `GET /buildings` returns it. */
export type Building = ApiBuilding;

// The operator dropdown works with the users API shape directly.
export type User = AdminUser;

export interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  operators?: User[];
}

/** Matches EditPropertyModal formData / API property shape */
export interface PropertyFormData {
  title: string;
  apartment_number: string;
  descriptions: string;
  price: number | null;
  deposit: number | null;
  available_from: string | null;
  bills: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  building_type: string;
  furnishing: string;
  let_duration: string[];
  floor: number | null;
  balcony: boolean;
  terrace: boolean;
  square_meters: number | null;
  // UI-only field: area entered in square feet. Converted to square_meters on submit.
  square_feet: number | null;
  photos: string[];
  video: string;
  documents: string;
  building_id: string;
  address: string;
  tenant_types: string[];
  amenities: string[];
  property_amenities: string[];
  family_status: string[];
  occupation: string[];
  children: string[];
  pets: Pet[] | null;
  pet_policy: boolean;
  metro_stations: MetroStation[];
  commute_times: CommuteTime[];
  local_essentials: LocalEssential[];
  operator_id: string;
}

/**
 * What the edit modal actually needs from an operator: it renders a name or
 * an email and stores the id. Typing the list as `User` promised far more
 * than the dropdown uses, and the placeholder entries built in the loader
 * never satisfied it.
 */
export interface OperatorOption {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
}

/**
 * The edit form's state shape, kept separate from `PropertyFormData` on
 * purpose: the edit monolith typed its enum-ish fields with the property
 * unions (`Bills | ""` etc.) while the create form uses plain strings, and
 * the two prefill/reset semantics differ. Unifying them is not this step.
 */
export interface EditPropertyFormData {
  title: string;
  apartment_number: string;
  descriptions: string;
  price: number | null;
  deposit: number | null;
  available_from: string | null;
  bills: Bills | "";
  property_type: PropertyType | "";
  bedrooms: number | null;
  bathrooms: number | null;
  building_type: BuildingType | "";
  furnishing: Furnishing | "";
  let_duration: string[];
  floor: number | null;
  balcony: boolean;
  terrace: boolean;
  square_meters: number | null;
  // UI-only field: area entered in square feet. Converted to square_meters on submit.
  square_feet: number | null;
  photos: string[];
  video: string;
  documents: string;
  building_id: string;
  // Inherited fields
  address: string;
  tenant_types: string[];
  amenities: string[];
  property_amenities: string[];
  family_status: string[];
  occupation: string[];
  children: string[];
  pets: Pet[] | null;
  pet_policy: boolean;
  metro_stations: MetroStation[];
  commute_times: CommuteTime[];
  local_essentials: LocalEssential[];
  operator_id: string;
}
