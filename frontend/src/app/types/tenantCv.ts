export interface RentHistoryEntry {
  property_name: string;
  address?: string;
  city?: string;
  price_per_month?: number;
  bedrooms?: number;
  bathrooms?: number;
  size_sqft?: number;
  property_type?: string;
  furnishing?: string;
  match_score?: number;
  review?: string;
  landlord?: string;
  period_from?: string;
  period_to?: string | null;
  media_url?: string;
}

export interface TenantCvProfile {
  full_name: string | null;
  avatar_url?: string | null;
  email?: string | null;
  phone?: string | null;
  age_years?: number | null;
  nationality?: string | null;
  occupation?: string | null;
  address?: string | null;
}

export interface TenantCvMeta {
  headline?: string | null;
  kyc_status?: string | null;
  referencing_status?: string | null;
  move_in_date?: string | null;
  move_out_date?: string | null;
  created_at?: string | null;
  smoker?: string | null;
  pets?: string | null;
  tenant_type_labels?: string[];
}

export interface TenantCvResponse {
  user_id: string;
  share_uuid?: string | null;
  profile: TenantCvProfile;
  meta: TenantCvMeta;
  preferences?: any; // snapshot of server preferences; narrowed per use
  amenities?: string[];
  about?: string | null;
  hobbies?: string[];
  rent_history?: RentHistoryEntry[];
}
