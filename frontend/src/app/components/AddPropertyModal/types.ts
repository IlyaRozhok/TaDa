import type { Building as ApiBuilding } from "@/store/api/buildings.api";

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

export interface User {
  id: string;
  email: string;
  full_name?: string;
}

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
