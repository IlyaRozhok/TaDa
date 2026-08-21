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
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  /** Anonymous share-link view: email/phone masked, address withheld. */
  contacts_masked?: boolean;
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

/**
 * Snapshot of the server-side preferences row. Only the fields the CV renders
 * are described; everything is optional and nullable because the snapshot is
 * taken from a row where every column is.
 */
export interface TenantCvPreferences {
  preferred_address?: string | null;
  preferred_areas?: string[] | null;
  preferred_districts?: string[] | null;
  preferred_metro_stations?: string[] | null;
  min_price?: number | null;
  max_price?: number | null;
  min_square_meters?: number | null;
  max_square_meters?: number | null;
  bedrooms?: number[] | null;
  bathrooms?: number[] | null;
  property_types?: string[] | null;
  building_types?: string[] | null;
  furnishing?: string[] | null;
  let_duration?: string | null;
  bills?: string | null;
  amenities?: string[] | null;
  hobbies?: string[] | null;
  tenant_types?: string[] | null;
  children_count?: string | null;
  family_status?: string | null;
  additional_info?: string | null;
  balcony?: boolean | null;
  terrace?: boolean | null;
  outdoor_space?: boolean | null;
  is_concierge?: boolean | null;
  smoking_area?: boolean | null;
}

export interface TenantCvResponse {
  user_id: string;
  share_uuid?: string | null;
  profile: TenantCvProfile;
  meta: TenantCvMeta;
  preferences?: TenantCvPreferences | null;
  amenities?: string[];
  about?: string | null;
  hobbies?: string[];
  rent_history?: RentHistoryEntry[];
}
