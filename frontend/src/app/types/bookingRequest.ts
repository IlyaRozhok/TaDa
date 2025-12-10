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
  status: BookingRequestStatus;
  created_at: string;
  updated_at: string;
  property?: {
    id: string;
    apartment_number?: string;
    title?: string;
    address?: string;
  };
  tenant?: {
    id: string;
    email: string;
    full_name?: string | null;
    tenantCv?: {
      share_uuid?: string | null;
    } | null;
  };
}
