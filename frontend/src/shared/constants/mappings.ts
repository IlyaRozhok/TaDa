/**
 * Shared constants and mappings for ensuring consistency between
 * preferences UI, admin forms, and backend matching logic
 */

// ==================== BUILDING TYPES MAPPING ====================

export const BUILDING_TYPE_UI_TO_API: Record<string, string> = {
  BTR: "btr",
  "Co-living": "co_living",
  "Professional Management": "professional_management",
  "Private Landlord": "private_landlord",
};

export const BUILDING_TYPE_API_TO_UI: Record<string, string> = {
  btr: "BTR",
  co_living: "Co-living",
  professional_management: "Professional Management",
  private_landlord: "Private Landlord",
  // Additional admin form values that might exist in DB
  luxury: "Luxury",
  student_accommodation: "Student Accommodation",
  retirement_home: "Retirement Home",
};

// ==================== TENANT TYPES MAPPING ====================

export const TENANT_TYPE_UI_TO_API: Record<string, string> = {
  Professional: "corporateLets", // Map Professional -> corporateLets for backward compatibility
  Student: "student",
  "Corporate tenant": "corporateLets",
  Family: "family",
  "Sharers / Friends": "sharers",
  Other: "family", // Default fallback
};

export const TENANT_TYPE_API_TO_UI: Record<string, string> = {
  corporateLets: "Professional", // Primary mapping
  student: "Student",
  family: "Family",
  sharers: "Sharers / Friends",
  elder: "Other", // Map elder to Other since it's not in preferences UI
};

// ==================== DURATION MAPPING ====================

export const DURATION_UI_TO_API: Record<string, string> = {
  "Short term (1–6 months)": "short_term",
  "Medium term (6–12 months)": "long_term", // Medium term maps to long_term in API
  "Long term (12+ months)": "long_term",
  Flexible: "flexible",
};

export const DURATION_API_TO_UI: Record<string, string> = {
  short_term: "Short term (1–6 months)",
  long_term: "Long term (12+ months)", // Default mapping for long_term
  flexible: "Flexible",
  any: "Flexible", // Map any to Flexible
};

// ==================== BILLS MAPPING ====================

export const BILLS_UI_TO_API: Record<string, string> = {
  Include: "included",
  Exclude: "excluded",
};

export const BILLS_API_TO_UI: Record<string, string> = {
  included: "Include",
  excluded: "Exclude",
};

// ==================== PROPERTY TYPE MAPPING ====================

// Property types from preferences UI (localized) to admin forms/backend
export const PROPERTY_TYPE_UI_TO_API: Record<string, string> = {
  Apartment: "apartment", // property.type.name1
  Flat: "flat", // property.type.name2
  Studio: "studio", // property.type.name3
  Penthouse: "penthouse", // property.type.name4
  "En-suite room": "room", // property.type.name5
  Room: "room", // property.type.name6
};

export const PROPERTY_TYPE_API_TO_UI: Record<string, string> = {
  apartment: "Apartment",
  flat: "Flat",
  studio: "Studio",
  penthouse: "Penthouse",
  room: "Room", // Default for both room types
  house: "House", // Additional admin form value
};

// ==================== UNIT TYPE MAPPING (Building) ====================

// Building unit types from preferences to admin forms
export const UNIT_TYPE_UI_TO_API: Record<string, string> = {
  Studio: "studio", // property.type.name3 -> building unit type
  Apartment: "1-bed", // Default mapping for apartment
  Flat: "1-bed", // Default mapping for flat
  Penthouse: "penthouse", // property.type.name4 -> building unit type
  "En-suite room": "studio", // Map to studio as closest match
  Room: "studio", // Map to studio as closest match
  "1 bedroom": "1-bed",
  "2 bedrooms": "2-bed",
  "3 bedrooms": "3-bed",
  Duplex: "Duplex",
};

export const UNIT_TYPE_API_TO_UI: Record<string, string> = {
  studio: "Studio",
  "1-bed": "1 bedroom",
  "2-bed": "2 bedrooms",
  "3-bed": "3 bedrooms",
  Duplex: "Duplex",
  penthouse: "Penthouse",
};

// ==================== FURNISHING MAPPING ====================

export const FURNISHING_UI_TO_API: Record<string, string> = {
  Furnished: "furnished", // furnishing.count.name1
  Unfurnished: "unfurnished", // furnishing.count.name2
  "Part-furnished": "part_furnished", // furnishing.count.name3
};

export const FURNISHING_API_TO_UI: Record<string, string> = {
  furnished: "Furnished",
  unfurnished: "Unfurnished",
  part_furnished: "Part-furnished",
  designer_furniture: "Furnished", // Map designer furniture to furnished
};

// ==================== OUTDOOR SPACE MAPPING ====================

export const OUTDOOR_SPACE_UI_TO_API: Record<string, string> = {
  Balcony: "balcony", // outdoorspace.name1
  Terrace: "terrace", // outdoorspace.name2
  "Outdoor Space": "outdoor_space", // Generic outdoor space
};

export const OUTDOOR_SPACE_API_TO_UI: Record<string, string> = {
  balcony: "Balcony",
  terrace: "Terrace",
  outdoor_space: "Outdoor Space",
};

// ==================== ROOMS/BEDROOMS MAPPING ====================

export const ROOMS_UI_TO_API: Record<string, number> = {
  "1": 1, // rooms.count.name1
  "2": 2, // rooms.count.name2
  "3": 3, // rooms.count.name3
  "4": 4, // rooms.count.name4
  "5+": 5, // rooms.count.name5
};

export const ROOMS_API_TO_UI: Record<number, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5+",
};

// ==================== BATHROOMS MAPPING ====================

export const BATHROOMS_UI_TO_API: Record<string, number> = {
  "1": 1, // bathrooms.count.name1
  "2": 2, // bathrooms.count.name2
  "3": 3, // bathrooms.count.name3
  "4+": 4, // bathrooms.count.name4
};

export const BATHROOMS_API_TO_UI: Record<number, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4+",
};

// ==================== AMENITIES MAPPING ====================

// Admin form amenities (15 items) - these are stored in the database
export const ADMIN_AMENITIES = [
  "Gym",
  "Co-working",
  "Meeting rooms",
  "Lounge",
  "Cinema",
  "Roof terrace",
  "Courtyard",
  "Parking",
  "Bike storage",
  "Parcel room",
  "Maintenance",
  "Events calendar",
  "Pet areas",
  "Kids' room",
  "Garden",
] as const;

// Preferences UI amenities mapping to admin amenities
export const PREFERENCES_AMENITIES_TO_ADMIN: Record<string, string> = {
  // Lifestyle features
  gym: "Gym",
  pool: "Garden", // No direct match, map to Garden
  garden: "Garden",
  spa: "Garden", // No direct match
  cinema: "Cinema",
  library: "Lounge", // No direct match, map to Lounge

  // Social features
  "communal-space": "Lounge",
  rooftop: "Roof terrace",
  events: "Events calendar",
  bbq: "Garden", // No direct match
  "games-room": "Lounge", // No direct match

  // Work features
  "co-working": "Co-working",
  "meeting-rooms": "Meeting rooms",
  "high-speed-wifi": "Co-working", // No direct match
  "business-center": "Co-working", // No direct match

  // Convenience features
  parking: "Parking",
  storage: "Parcel room", // Closest match
  laundry: "Maintenance", // No direct match
  concierge: "Maintenance", // Handled separately via is_concierge
  security: "Maintenance", // No direct match

  // Pet features
  "pet-park": "Pet areas",
  "pet-washing": "Pet areas",
  "pet-sitting": "Pet areas",
  "pet-friendly": "Pet areas",

  // Luxury features
  concierge: "Maintenance", // Handled via is_concierge flag
  valet: "Maintenance", // No direct match
  spa: "Garden", // No direct match
  "wine-cellar": "Lounge", // No direct match
  "private-dining": "Lounge", // No direct match
};

// Reverse mapping for displaying admin amenities in preferences context
export const ADMIN_AMENITIES_TO_PREFERENCES: Record<string, string[]> = {
  Gym: ["gym"],
  "Co-working": ["co-working"],
  "Meeting rooms": ["meeting-rooms"],
  Lounge: ["communal-space"],
  Cinema: ["cinema"],
  "Roof terrace": ["rooftop"],
  Courtyard: ["garden"],
  Parking: ["parking"],
  "Bike storage": ["storage"],
  "Parcel room": ["storage"],
  Maintenance: ["concierge", "security"],
  "Events calendar": ["events"],
  "Pet areas": ["pet-friendly"],
  "Kids' room": ["communal-space"],
  Garden: ["garden"],
};

// ==================== HELPER FUNCTIONS ====================

export function transformBuildingTypeUIToAPI(uiValues: string[]): string[] {
  return uiValues
    .map((value) => BUILDING_TYPE_UI_TO_API[value])
    .filter(Boolean);
}

export function transformBuildingTypeAPIToUI(apiValues: string[]): string[] {
  return apiValues
    .map((value) => BUILDING_TYPE_API_TO_UI[value])
    .filter(Boolean);
}

export function transformTenantTypeUIToAPI(uiValues: string[]): string[] {
  return uiValues.map((value) => TENANT_TYPE_UI_TO_API[value]).filter(Boolean);
}

export function transformTenantTypeAPIToUI(apiValues: string[]): string[] {
  return apiValues.map((value) => TENANT_TYPE_API_TO_UI[value]).filter(Boolean);
}

export function transformDurationUIToAPI(uiValue: string): string {
  return DURATION_UI_TO_API[uiValue] || uiValue;
}

export function transformDurationAPIToUI(apiValue: string): string {
  return DURATION_API_TO_UI[apiValue] || apiValue;
}

export function transformBillsUIToAPI(uiValue: string): string {
  return BILLS_UI_TO_API[uiValue] || uiValue;
}

export function transformBillsAPIToUI(apiValue: string): string {
  return BILLS_API_TO_UI[apiValue] || apiValue;
}

export function transformPreferencesAmenitiesToAdmin(
  preferencesAmenities: string[],
): string[] {
  const adminAmenities = new Set<string>();

  preferencesAmenities.forEach((pref) => {
    const adminAmenity = PREFERENCES_AMENITIES_TO_ADMIN[pref];
    if (adminAmenity) {
      adminAmenities.add(adminAmenity);
    }
  });

  return Array.from(adminAmenities);
}

export function transformAdminAmenitiesToPreferences(
  adminAmenities: string[],
): string[] {
  const preferencesAmenities = new Set<string>();

  adminAmenities.forEach((admin) => {
    const prefAmenities = ADMIN_AMENITIES_TO_PREFERENCES[admin];
    if (prefAmenities) {
      prefAmenities.forEach((pref) => preferencesAmenities.add(pref));
    }
  });

  return Array.from(preferencesAmenities);
}

export function transformPropertyTypeUIToAPI(uiValues: string[]): string[] {
  return uiValues
    .map((value) => PROPERTY_TYPE_UI_TO_API[value])
    .filter(Boolean);
}

export function transformPropertyTypeAPIToUI(apiValues: string[]): string[] {
  return apiValues
    .map((value) => PROPERTY_TYPE_API_TO_UI[value])
    .filter(Boolean);
}

export function transformUnitTypeUIToAPI(uiValues: string[]): string[] {
  return uiValues.map((value) => UNIT_TYPE_UI_TO_API[value]).filter(Boolean);
}

export function transformUnitTypeAPIToUI(apiValues: string[]): string[] {
  return apiValues.map((value) => UNIT_TYPE_API_TO_UI[value]).filter(Boolean);
}

export function transformFurnishingUIToAPI(uiValues: string[]): string[] {
  return uiValues.map((value) => FURNISHING_UI_TO_API[value]).filter(Boolean);
}

export function transformFurnishingAPIToUI(apiValues: string[]): string[] {
  return apiValues.map((value) => FURNISHING_API_TO_UI[value]).filter(Boolean);
}

export function transformOutdoorSpaceUIToAPI(uiValues: string[]): {
  outdoor_space?: boolean;
  balcony?: boolean;
  terrace?: boolean;
} {
  const result: {
    outdoor_space?: boolean;
    balcony?: boolean;
    terrace?: boolean;
  } = {};

  uiValues.forEach((value) => {
    const apiValue = OUTDOOR_SPACE_UI_TO_API[value];
    if (apiValue === "outdoor_space") result.outdoor_space = true;
    if (apiValue === "balcony") result.balcony = true;
    if (apiValue === "terrace") result.terrace = true;
  });

  return result;
}

export function transformOutdoorSpaceAPIToUI(
  outdoor_space?: boolean,
  balcony?: boolean,
  terrace?: boolean,
): string[] {
  const result: string[] = [];

  if (outdoor_space) result.push(OUTDOOR_SPACE_API_TO_UI["outdoor_space"]);
  if (balcony) result.push(OUTDOOR_SPACE_API_TO_UI["balcony"]);
  if (terrace) result.push(OUTDOOR_SPACE_API_TO_UI["terrace"]);

  return result.filter(Boolean);
}

export function transformRoomsUIToAPI(uiValues: string[]): number[] {
  return uiValues
    .map((value) => ROOMS_UI_TO_API[value])
    .filter((value) => value !== undefined);
}

export function transformRoomsAPIToUI(apiValues: number[]): string[] {
  return apiValues.map((value) => ROOMS_API_TO_UI[value]).filter(Boolean);
}

export function transformBathroomsUIToAPI(uiValues: string[]): number[] {
  return uiValues
    .map((value) => BATHROOMS_UI_TO_API[value])
    .filter((value) => value !== undefined);
}

export function transformBathroomsAPIToUI(apiValues: number[]): string[] {
  return apiValues.map((value) => BATHROOMS_API_TO_UI[value]).filter(Boolean);
}
