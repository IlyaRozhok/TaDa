import { Property, PropertyStatus } from "../../entities/property.entity";

// Minimal public-facing projection; adjust if more fields should be exposed
export type PublicPropertyResponse = {
  id: string;
  /**
   * Listing lifecycle. Lists only ever contain `listed` rows; the detail
   * endpoint also resolves `under_offer` and `let` so shared links keep
   * working — clients badge those instead of hiding them.
   */
  status: PropertyStatus;
  /** Present so clients can filter by landlord without loading full operator relation */
  operator_id: string | null;
  title: string | null;
  descriptions: string | null;
  address: string | null;
  /** Normalized UK postcode, geocoded on save (null when unresolvable). */
  postcode: string | null;
  /** London borough from the postcode (postcodes.io admin_district). */
  borough: string | null;
  /** EPC band (A-G) — legally required on listing advertisements. */
  epc_rating: string | null;
  /**
   * Tenant Fees Act 2019: the deposit may not exceed 5 weeks' rent (6 when
   * the annual rent is £50,000 or more). True when the listed deposit breaks
   * that cap — the client should surface it to the operator; null when price
   * or deposit is missing.
   */
  deposit_exceeds_cap: boolean | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  photos: string[];
  building_type: Property["building_type"] | null;
  property_type: Property["property_type"] | null;
  furnishing: Property["furnishing"] | null;
  available_from: Date | null;
  created_at: Date;
  /** Featured in the landing pages' listings section. */
  is_landing_listing: boolean;
  building?: {
    id: string;
    name: string;
    address?: string;
    logo?: string | null;
  } | null;
  amenities?: string[];
  property_amenities?: string[];
  deposit?: number | null;
  bills?: string | null;
};

export const toPublicProperty = (
  property: Property
): PublicPropertyResponse => {
  // Convert decimal price to number (TypeORM may return it as string)
  let price: number | null = null;
  if (property.price !== null && property.price !== undefined) {
    if (typeof property.price === "string") {
      const parsed = parseFloat(property.price);
      price = isNaN(parsed) ? null : parsed;
    } else {
      price = Number(property.price);
    }
  }

  // Convert decimal square_meters to number
  let square_meters: number | null = null;
  if (property.square_meters !== null && property.square_meters !== undefined) {
    if (typeof property.square_meters === "string") {
      const parsed = parseFloat(property.square_meters);
      square_meters = isNaN(parsed) ? null : parsed;
    } else {
      square_meters = Number(property.square_meters);
    }
  }

  let deposit: number | null = null;
  if (property.deposit !== null && property.deposit !== undefined) {
    if (typeof property.deposit === "string") {
      const parsed = parseFloat(property.deposit);
      deposit = isNaN(parsed) ? null : parsed;
    } else {
      deposit = Number(property.deposit);
    }
  }

  // Tenant Fees Act cap: 5 weeks' rent below £50k annual rent, 6 weeks at or
  // above. Rounded to pence so a 1p float artifact cannot flag a compliant
  // deposit.
  let deposit_exceeds_cap: boolean | null = null;
  if (price !== null && price > 0 && deposit !== null) {
    const annualRent = price * 12;
    const weeklyRent = annualRent / 52;
    const capWeeks = annualRent >= 50000 ? 6 : 5;
    const cap = Math.round(weeklyRent * capWeeks * 100) / 100;
    deposit_exceeds_cap = deposit > cap;
  }

  return {
    id: property.id,
    status: property.status ?? PropertyStatus.Listed,
    operator_id: property.operator_id ?? null,
    epc_rating: property.epc_rating ?? null,
    deposit_exceeds_cap,
    title: property.title || null,
    descriptions: property.descriptions ?? null,
    address: property.address || null,
    postcode: property.postcode ?? null,
    borough: property.borough ?? null,
    price,
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    square_meters,
    photos: Array.isArray(property.photos) ? property.photos : [],
    building_type: property.building_type || null,
    property_type: property.property_type || null,
    furnishing: property.furnishing || null,
    available_from: property.available_from || null,
    created_at: property.created_at,
    is_landing_listing: property.is_landing_listing ?? false,
    building: property.building
      ? {
          id: property.building.id,
          name: property.building.name,
          address: property.building.address || undefined,
          logo: property.building.logo || null,
        }
      : null,
    amenities: Array.isArray(property.amenities) ? property.amenities : [],
    property_amenities: Array.isArray(property.property_amenities)
      ? property.property_amenities
      : [],
    deposit,
    bills: property.bills ?? null,
  };
};
