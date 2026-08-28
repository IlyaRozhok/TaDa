export type CallRequestSource = "tenant" | "operator";

/** Row of `call_requests` as the admin listing returns it. */
export interface CallRequest {
  id: string;
  /** Stable slug; the label is looked up client-side for display. */
  reason: string;
  name: string;
  phone_country_code: string;
  phone_number: string;
  preferred_times?: string[] | null;
  notes?: string | null;
  source: CallRequestSource;
  created_at: string;
  updated_at: string;
}

/**
 * Slug → English label, mirroring backend `call-request.vocabulary.ts`. The
 * admin panel is English-only, so these are not translated; an unknown slug
 * renders as itself rather than as a blank cell.
 */
export const CALL_REASON_LABELS: Record<string, string> = {
  help_find_home: "Help me find a home",
  finish_rental_cv: "Help me finish my Rental CV",
  question_about_property: "I have a question about a property",
  units_to_fill: "I have units to fill",
  see_demo: "I want to see a demo",
  pricing_and_terms: "I want to discuss pricing and terms",
  landlord_to_let: "I'm a landlord with a property to let",
  agent_partner: "I'm a letting agent looking to partner",
  connect_feed: "I want to connect a property feed",
  looking_for_home: "I'm looking for a home",
  something_else: "Something else",
};

export const PREFERRED_TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  asap: "ASAP",
};
