/**
 * The closed vocabularies of the "Book a call" form.
 *
 * The client sends slugs, never the labels the visitor read: the landing is
 * translated, so a label is a per-language value while the slug is the fact.
 * The English labels here exist for one reader only — the support inbox, which
 * gets a plain-text email and no lookup table.
 *
 * Reason slugs are namespaced by audience because the two landings offer
 * different lists; `something_else` is deliberately shared, and the DTO
 * validates against the union rather than per-source. Cross-source values are
 * accepted on purpose: a stricter check would buy nothing (the payload only
 * ever reaches an internal inbox) and would break the moment product moves an
 * option from one landing to the other.
 */

export const TENANT_CALL_REASONS = {
  help_find_home: "Help me find a home",
  finish_rental_cv: "Help me finish my Rental CV",
  question_about_property: "I have a question about a property",
  something_else: "Something else",
} as const;

export const OPERATOR_CALL_REASONS = {
  units_to_fill: "I have units to fill",
  see_demo: "I want to see a demo",
  pricing_and_terms: "I want to discuss pricing and terms",
  landlord_to_let: "I'm a landlord with a property to let",
  agent_partner: "I'm a letting agent looking to partner",
  connect_feed: "I want to connect a property feed",
  looking_for_home: "I'm looking for a home",
  something_else: "Something else",
} as const;

/** Every reason slug either landing can send. */
export const CALL_REASON_LABELS: Record<string, string> = {
  ...TENANT_CALL_REASONS,
  ...OPERATOR_CALL_REASONS,
};

export const CALL_REASON_SLUGS = Object.keys(CALL_REASON_LABELS);

export const PREFERRED_TIME_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  asap: "ASAP",
} as const;

export const PREFERRED_TIME_SLUGS = Object.keys(PREFERRED_TIME_LABELS);

export const CALL_REQUEST_SOURCES = ["tenant", "operator"] as const;

/**
 * Slug → English label for the email body. An unknown slug renders as itself
 * rather than as an empty line: a stored row from a build that knew one more
 * option must still produce a readable email.
 */
export const labelForReason = (slug: string): string =>
  CALL_REASON_LABELS[slug] ?? slug;

export const labelForPreferredTime = (slug: string): string =>
  PREFERRED_TIME_LABELS[slug as keyof typeof PREFERRED_TIME_LABELS] ?? slug;
