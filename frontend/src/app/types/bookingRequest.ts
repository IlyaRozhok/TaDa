export type BookingRequestStatus =
  | "new"
  | "contacting"
  | "kyc_referencing"
  | "approved_viewing"
  | "viewing"
  | "contract"
  | "deposit"
  | "full_payment"
  | "move_in"
  | "rented"
  | "cancel_booking";

export interface BookingRequest {
  id: string;
  property_id: string;
  tenant_id: string;
  date_from?: string | null;
  date_to?: string | null;
  /** The tenant's free text from the booking form. */
  description?: string | null;
  proposed_viewing_at?: string | null;
  viewing_confirmed_at?: string | null;
  email?: string | null;
  phone_number?: string | null;
  status: BookingRequestStatus;
  created_at: string;
  updated_at: string;
  property?: {
    id: string;
    apartment_number?: string;
    title?: string;
    /** A decimal column: arrives as a string. */
    price?: number | string | null;
    building_id?: string | null;
    is_visible?: boolean;
    building?: {
      id: string;
      name: string;
      is_visible?: boolean;
    } | null;
  };
  tenant?: {
    id: string;
    email: string;
    full_name?: string | null;
    phone?: string | null;
    tenantCv?: {
      share_uuid?: string | null;
    } | null;
  };
}
