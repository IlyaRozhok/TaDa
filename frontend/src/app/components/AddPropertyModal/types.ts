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

export interface Building {
  id: string;
  name: string;
  address: string;
  operator_id: string;
  tenant_type?: string[];
  amenities?: string[];
  is_concierge?: boolean;
  concierge_hours?: ConciergeHours | null;
  pet_policy?: boolean;
  pets?: Pet[] | null;
  smoking_area?: boolean;
  metro_stations?: MetroStation[];
  commute_times?: CommuteTime[];
  local_essentials?: LocalEssential[];
}

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
  luxury: boolean;
  furnishing: string;
  let_duration: string[];
  floor: number | null;
  outdoor_space: boolean;
  balcony: boolean;
  terrace: boolean;
  square_meters: number | null;
  photos: string[];
  video: string;
  documents: string;
  building_id: string;
  address: string;
  tenant_types: string[];
  amenities: string[];
  pets: Pet[] | null;
  is_concierge: boolean;
  concierge_hours: ConciergeHours | null;
  pet_policy: boolean;
  smoking_area_prop: boolean;
  metro_stations: MetroStation[];
  commute_times: CommuteTime[];
  local_essentials: LocalEssential[];
  operator_id: string;
}
