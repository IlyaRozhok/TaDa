/**
 * The closed vocabulary of the "Book a call" form.
 *
 * The client sends slugs, never the labels the visitor read: the landing is
 * translated, so a label is a per-language value while the slug is the fact.
 * The English labels here exist for one reader only — the support inbox, which
 * gets a plain-text email and no lookup table.
 *
 * One shared list serves both landings. The audience is still recorded, but
 * through `source`, not through a split vocabulary: the visitor's reason and
 * the page they arrived on are two independent facts, and splitting them made
 * the same option carry two slugs.
 *
 * The order is the order the modal renders, and the frontend's positional
 * Localazy keys (`book.call.field1.option1`…`option10`) follow it — reordering
 * the list means renumbering those keys.
 */
export const CALL_REASON_LABELS: Record<string, string> = {
  units_to_fill: "I have units to fill",
  see_demo: "I want to see a demo",
  pricing_and_terms: "I want to discuss pricing and terms",
  landlord_to_let: "I'm a landlord with a property to let",
  agent_partner: "I'm a letting agent looking to partner",
  connect_feed: "I want to connect a property feed",
  looking_for_home: "I'm looking for a home",
  finish_rental_cv: "Help me finish my Rental CV",
  question_about_property: "I have a question about a property",
  something_else: "Something else",
};

export const CALL_REASON_SLUGS = Object.keys(CALL_REASON_LABELS);

export const CALL_REQUEST_SOURCES = ["tenant", "operator"] as const;

/**
 * How the visitor wants to be reached. This is the one field that changes the
 * shape of the rest of the payload: `email` means the form collected an email
 * address and no phone, the other two mean the reverse. Positional Localazy
 * keys `book.call.field3.option1`…`option3` follow this order.
 */
export const CONTACT_METHOD_LABELS = {
  voice_call: "Voice call",
  video_call: "Video call",
  email: "Email",
} as const;

export const CONTACT_METHOD_SLUGS = Object.keys(
  CONTACT_METHOD_LABELS,
) as (keyof typeof CONTACT_METHOD_LABELS)[];

/** The one method that swaps the phone field for an email address. */
export const EMAIL_CONTACT_METHOD = "email";

/**
 * Slug → English label for the email body. An unknown slug renders as itself
 * rather than as an empty line: a stored row from a build that knew one more
 * option must still produce a readable email.
 */
export const labelForReason = (slug: string): string =>
  CALL_REASON_LABELS[slug] ?? slug;

export const labelForContactMethod = (slug: string): string =>
  CONTACT_METHOD_LABELS[slug as keyof typeof CONTACT_METHOD_LABELS] ?? slug;
