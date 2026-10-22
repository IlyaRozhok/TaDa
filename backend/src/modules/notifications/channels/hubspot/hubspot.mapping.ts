import type { HubspotPropertyDefinition } from "./hubspot.client";

/** HubSpot's default lifecycle stages, lowest to highest. */
export const LIFECYCLE_ORDER = [
  "subscriber",
  "lead",
  "marketingqualifiedlead",
  "salesqualifiedlead",
  "opportunity",
  "customer",
  "evangelist",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_ORDER)[number];

/**
 * The stage to write, or null to leave the contact's stage alone. Stages only
 * ever move forward: a contact already at SQL is not knocked back to lead by
 * a later, lower-intent event. An unknown current value (a portal's custom
 * stage, or "other") is left untouched rather than guessed at.
 */
export function advanceLifecycle(
  current: string | null | undefined,
  target: LifecycleStage,
): LifecycleStage | null {
  if (!current) return target;
  const from = LIFECYCLE_ORDER.indexOf(current as LifecycleStage);
  if (from === -1) return null;
  return LIFECYCLE_ORDER.indexOf(target) > from ? target : null;
}

/** The TaDa-specific contact properties. Created on first run when the key allows it. */
export const CUSTOM_CONTACT_PROPERTIES: HubspotPropertyDefinition[] = [
  {
    name: "tada_nationality",
    label: "TaDa nationality",
    type: "string",
    fieldType: "text",
    groupName: "contactinformation",
    description: "Nationality from the TaDa profile.",
  },
  {
    name: "tada_source",
    label: "TaDa source",
    type: "string",
    fieldType: "text",
    groupName: "contactinformation",
    description: "tenant or operator: the account role, or the landing a call request came from.",
  },
  {
    name: "tada_cv_url",
    label: "TaDa CV link",
    type: "string",
    fieldType: "text",
    groupName: "contactinformation",
    description: "Public link to the tenant's TaDa CV.",
  },
  {
    name: "tada_signup_date",
    label: "TaDa signup date",
    type: "date",
    fieldType: "date",
    groupName: "contactinformation",
    description: "When the TaDa account was created.",
  },
];

/**
 * The deal's links, clickable in the record (HubSpot linkifies URLs in
 * single-line text). Created on first run with crm.schemas.deals.write.
 */
export const CUSTOM_DEAL_PROPERTIES: HubspotPropertyDefinition[] = [
  {
    name: "tada_cv_url",
    label: "Tenant CV",
    type: "string",
    fieldType: "text",
    groupName: "dealinformation",
    description: "Public link to the tenant's TaDa CV.",
  },
  {
    name: "tada_property_url",
    label: "Property",
    type: "string",
    fieldType: "text",
    groupName: "dealinformation",
    description: "Public page of the property the deal is about.",
  },
];

/** Where links point when FRONTEND_URL is not set. */
export const DEFAULT_SITE_URL = "https://ta-da.co";

/**
 * The site the links point at: the host's FRONTEND_URL (stage links to
 * stage, prod to prod), without a trailing slash.
 */
export function siteBase(frontendUrl: string | null | undefined): string {
  return (frontendUrl?.trim() || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

/** "Jane Mary Doe" → { first: "Jane", last: "Mary Doe" }. */
export function splitName(full: string | null | undefined): { first: string; last: string } {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

export interface ContactFacts {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  nationality?: string | null;
  source?: string | null;
  cvUrl?: string | null;
  signupDate?: Date | string | null;
}

/**
 * HubSpot properties for the facts we have. Empty values are left out, so an
 * update never blanks a field HubSpot (or a person in HubSpot) already holds.
 * Custom properties go in only when they exist in the portal: writing an
 * unknown property fails the whole request.
 */
export function contactProperties(
  facts: ContactFacts,
  availableCustom: ReadonlySet<string>,
): Record<string, string> {
  const properties: Record<string, string> = {};
  const put = (name: string, value: string | null | undefined, custom = false) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    if (custom && !availableCustom.has(name)) return;
    properties[name] = trimmed;
  };

  put("email", facts.email?.toLowerCase());
  put("firstname", facts.firstName);
  put("lastname", facts.lastName);
  put("phone", facts.phone);
  put("tada_nationality", facts.nationality, true);
  put("tada_source", facts.source, true);
  put("tada_cv_url", facts.cvUrl, true);
  if (facts.signupDate) {
    const date = new Date(facts.signupDate);
    if (!Number.isNaN(date.getTime())) {
      put("tada_signup_date", date.toISOString().slice(0, 10), true);
    }
  }
  return properties;
}

/** The public CV link (frontend route /cv/[uuid]). Never an admin-panel link. */
export function cvUrl(shareUuid: string | null | undefined, base = DEFAULT_SITE_URL): string | null {
  return shareUuid ? `${base}/cv/${shareUuid}` : null;
}

/**
 * The public property page (frontend route /app/properties/[id] — open to
 * guests, the page's own canonical URL).
 */
export function propertyUrl(propertyId: string | null | undefined, base = DEFAULT_SITE_URL): string | null {
  return propertyId ? `${base}/app/properties/${propertyId}` : null;
}

/** The deal's link properties that have a value and exist in the portal. */
export function dealLinkProperties(
  links: { cvUrl?: string | null; propertyUrl?: string | null },
  availableCustom: ReadonlySet<string>,
): Record<string, string> {
  const properties: Record<string, string> = {};
  if (links.cvUrl && availableCustom.has("tada_cv_url")) properties.tada_cv_url = links.cvUrl;
  if (links.propertyUrl && availableCustom.has("tada_property_url")) properties.tada_property_url = links.propertyUrl;
  return properties;
}

/** "Jane Doe — Booking: Flat 2B". */
export function dealName(contactName: string, propertyTitle: string | null | undefined): string {
  const who = contactName.trim() || "Unknown contact";
  return `${who} — Booking: ${propertyTitle?.trim() || "property"}`;
}
