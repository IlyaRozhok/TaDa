/** Pipeline stage → short label, shared by the admin table and the tenant view. */
export const BOOKING_STATUS_LABELS: Record<BookingRequestStatus, string> = {
  new: "New",
  contacting: "Contacting",
  kyc_referencing: "KYC / Referencing",
  approved_viewing: "Approved viewing",
  viewing: "Viewing",
  contract: "Contract",
  deposit: "Deposit",
  full_payment: "Full payment",
  move_in: "Move in",
  rented: "Rented",
  cancel_booking: "Cancelled",
};

/**
 * What each pipeline stage means, in the tenant's language. Mirrors the
 * backend's `STATUS_EXPLANATIONS` (notification.templates.ts) so the "my
 * requests" view and the status emails tell the same story.
 */
export const BOOKING_STATUS_EXPLANATIONS: Record<BookingRequestStatus, string> =
  {
    new: "We have received your request and will pick it up shortly.",
    contacting:
      "The operator is reviewing your request and will contact you soon.",
    kyc_referencing:
      "Identity and referencing checks are in progress. You may be asked for documents.",
    approved_viewing:
      "You are approved for a viewing — a date and time will be proposed to you soon.",
    viewing: "Your viewing is being arranged.",
    contract: "The tenancy contract is being prepared for you.",
    deposit: "The next step is the deposit payment.",
    full_payment: "The next step is the remaining payment.",
    move_in: "Your move-in is being arranged.",
    rented: "Your tenancy is complete — welcome to your new home!",
    cancel_booking:
      "Your booking was cancelled. If the property is re-listed you can apply again.",
  };

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
  description?: string | null;
  email?: string | null;
  phone_number?: string | null;
  status: BookingRequestStatus;
  /** Viewing slot proposed by the operator/admin, or null. */
  proposed_viewing_at?: string | null;
  /** When the tenant confirmed the proposed slot, or null. */
  viewing_confirmed_at?: string | null;
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
