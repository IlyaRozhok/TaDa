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

export interface PropertyFormData {
  title: string;
  apartment_number: string;
  building_type: string;
  building_id: string;
  operator_id: string;
  address: string;
  tenant_type: string[];
  price: string;
  security_deposit: string;
  admin_fee: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  floor: number;
  balcony: boolean;
  terrace: boolean;
  amenities: string[];
  is_concierge: boolean;
  concierge_hours: ConciergeHours | null;
  pet_policy: boolean;
  pets: Pet[];
  smoking_area: boolean;
  metro_stations: MetroStation[];
  commute_times: CommuteTime[];
  local_essentials: LocalEssential[];
  available_from: string;
  minimum_stay: number;
  maximum_stay: number;
  bills: string;
  furnishing: string;
  property_type: string;
}