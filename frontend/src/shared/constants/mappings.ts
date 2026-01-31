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

/** One API value can map to multiple UI options (so Corporate tenant/Other display after load). */
export const TENANT_TYPE_API_TO_UI_MULTI: Record<string, string[]> = {
  corporateLets: ["Professional", "Corporate tenant"],
  student: ["Student"],
  family: ["Family", "Other"],
  sharers: ["Sharers / Friends"],
  elder: ["Other"],
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

/** One API value can map to multiple UI options (so En-suite room and Room both display when API has "room"). */
export const PROPERTY_TYPE_API_TO_UI_MULTI: Record<string, string[]> = {
  apartment: ["Apartment"],
  flat: ["Flat"],
  studio: ["Studio"],
  penthouse: ["Penthouse"],
  room: ["En-suite room", "Room"],
  house: ["House"],
};

// ==================== UNIT TYPE MAPPING (Building) ====================

// 6 UI options map 1:1 to 6 backend enum values so all selections are saved.
export const UNIT_TYPE_UI_TO_API: Record<string, string> = {
  Apartment: "1-bed",
  Flat: "2-bed",
  Studio: "studio",
  Penthouse: "penthouse",
  "En-suite room": "3-bed",
  Room: "Duplex",
};

export const UNIT_TYPE_API_TO_UI: Record<string, string> = {
  "1-bed": "Apartment",
  "2-bed": "Flat",
  studio: "Studio",
  penthouse: "Penthouse",
  "3-bed": "En-suite room",
  Duplex: "Room",
};

/** Building form load: API value → UI label. 1:1 so all 6 options restore. */
export const BUILDING_UNIT_TYPE_API_TO_UI: Record<string, string> = {
  "1-bed": "Apartment",
  "2-bed": "Flat",
  studio: "Studio",
  penthouse: "Penthouse",
  "3-bed": "En-suite room",
  Duplex: "Room",
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
  partially_furnished: "Part-furnished", // Backend variant
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

// Admin form amenities (22 items) – same set as preferences Step 7, stored in the database
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
  "Reading",
  "Music",
  "Art",
  "Hiking",
  "Cooking",
  "Travel",
  "Sport",
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

  valet: "Maintenance", // No direct match
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

// ==================== HOBBIES (Tenant CV display) ====================
// Hobby keys stored in API (e.g. personal_growth_1) -> translation key (e.g. personal.growth.name1)

const HOBBY_PREFIX_TO_TRANSLATION_PREFIX: Record<string, string> = {
  personal_growth: "personal.growth.name",
  social_fun: "social.fun.name",
  sport_outdoors: "sport.outdoors.name",
  wellbeing_lifestyle: "wellbeing.lifestyle.name",
  creative_cultural: "creative.cultural.name",
};

export function getHobbyTranslationKey(hobbyKey: string): string | undefined {
  if (!hobbyKey || typeof hobbyKey !== "string") return undefined;
  const trimmed = hobbyKey.trim();
  for (const [prefix, transPrefix] of Object.entries(
    HOBBY_PREFIX_TO_TRANSLATION_PREFIX,
  )) {
    if (trimmed.startsWith(prefix + "_")) {
      const num = trimmed.slice(prefix.length + 1);
      if (/^\d+$/.test(num)) return `${transPrefix}${num}`;
    }
  }
  return undefined;
}

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
  return apiValues.flatMap((value) => {
    const multi = TENANT_TYPE_API_TO_UI_MULTI[value];
    if (multi?.length) return multi;
    const single = TENANT_TYPE_API_TO_UI[value];
    return single ? [single] : [];
  });
}

export function transformDurationUIToAPI(uiValue: string): string {
  return DURATION_UI_TO_API[uiValue] || uiValue;
}

export function transformDurationAPIToUI(apiValue: string): string {
  return DURATION_API_TO_UI[apiValue] || apiValue;
}

/** Multiselect: UI keys array → API comma-separated string. */
export function transformDurationUIToAPIArray(uiValues: string[]): string {
  const api = [
    ...new Set(uiValues.map((v) => DURATION_UI_TO_API[v]).filter(Boolean)),
  ];
  return api.join(",");
}

/** Multiselect: API comma-separated string → UI keys array. */
export function transformDurationAPIToUIArray(apiValue: string): string[] {
  if (!apiValue?.trim()) return [];
  return apiValue
    .split(",")
    .map((s) => transformDurationAPIToUI(s.trim()))
    .filter(Boolean);
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
  return apiValues.flatMap((value) => {
    const multi = PROPERTY_TYPE_API_TO_UI_MULTI[value];
    if (multi?.length) return multi;
    const single = PROPERTY_TYPE_API_TO_UI[value];
    return single ? [single] : [];
  });
}

export function transformUnitTypeUIToAPI(uiValues: string[]): string[] {
  return uiValues.map((value) => UNIT_TYPE_UI_TO_API[value]).filter(Boolean);
}

export function transformUnitTypeAPIToUI(apiValues: string[]): string[] {
  return apiValues.map((value) => UNIT_TYPE_API_TO_UI[value]).filter(Boolean);
}

/** Building form: map API type_of_unit to UI labels (preferences Step 3 style). */
export function buildingUnitTypeAPIToUI(apiValues: string[]): string[] {
  return apiValues
    .map((value) => BUILDING_UNIT_TYPE_API_TO_UI[value])
    .filter(Boolean);
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

// ==================== TRANSLATION KEYS FOR TENANT CV (API value → i18n key) ====================
// Use with t(getPropertyTypeTranslationKey(apiValue)) etc. so preference values are localized.

const PROPERTY_TYPE_API_TO_KEY: Record<string, string> = {
  apartment: "property.type.name1",
  flat: "property.type.name2",
  studio: "property.type.name3",
  penthouse: "property.type.name4",
  room: "property.type.name5",
  house: "property.type.name1",
};

const FURNISHING_API_TO_KEY: Record<string, string> = {
  furnished: "furnishing.count.name1",
  unfurnished: "furnishing.count.name2",
  part_furnished: "furnishing.count.name3",
  partially_furnished: "furnishing.count.name3",
  designer_furniture: "furnishing.count.name1",
};

const OUTDOOR_API_TO_KEY: Record<string, string> = {
  balcony: "outdoorspace.name1",
  terrace: "outdoorspace.name2",
  outdoor_space: "tenant.cv.outdoor.space",
};

const BILLS_API_TO_KEY: Record<string, string> = {
  included: "bills.name1",
  excluded: "bills.name2",
};

const TENANT_TYPE_API_TO_KEY: Record<string, string[]> = {
  corporateLets: ["tenant.type.name.1", "tenant.type.name.3"],
  student: ["tenant.type.name.2"],
  family: ["tenant.type.name.4"],
  sharers: ["tenant.type.name.5"],
  elder: ["tenant.type.name.6"],
};

const BUILDING_TYPE_API_TO_KEY: Record<string, string> = {
  btr: "buildtype.name1",
  co_living: "buildtype.name2",
  professional_management: "buildtype.name3",
  private_landlord: "buildtype.name4",
};

const DURATION_API_TO_KEY: Record<string, string> = {
  short_term: "rental.duration.name1",
  long_term: "rental.duration.name3",
  flexible: "rental.duration.name4",
  any: "rental.duration.name4",
};

/** Display name (e.g. from API or hardcoded) → translation key for amenities / outdoor / special. */
const AMENITY_DISPLAY_TO_KEY: Record<string, string> = {
  "Has Concierge Service": "amenities.name3",
  Concierge: "amenities.name3",
  "Has smoking area": "tenant.cv.smoking.area",
  Balcony: "outdoorspace.name1",
  Terrace: "outdoorspace.name2",
  "Outdoor space": "tenant.cv.outdoor.space",
  "Co-working": "amenities.name1",
  "Meeting rooms": "amenities.name2",
  "Parcel room": "amenities.name4",
  "Parcel lockers": "amenities.name4",
  Maintenance: "amenities.name5",
  Parking: "amenities.name8",
  "Bike storage": "amenities.name10",
  Gym: "amenities.name1",
  Lounge: "amenities.name1",
  Cinema: "amenities.name1",
  "Roof terrace": "outdoorspace.name2",
  Courtyard: "outdoorspace.name2",
  "Events calendar": "amenities.name1",
  "Pet areas": "amenities.name19",
  "Kids' room": "amenities.name21",
  Garden: "amenities.name1",
  Reading: "amenities.name1",
  Music: "amenities.name1",
  Art: "amenities.name1",
  Hiking: "amenities.name1",
  Cooking: "amenities.name1",
  Travel: "amenities.name1",
  Sport: "amenities.name1",
};

export function getPropertyTypeTranslationKey(
  apiValue: string,
): string | undefined {
  return PROPERTY_TYPE_API_TO_KEY[apiValue];
}

export function getFurnishingTranslationKey(
  apiValue: string,
): string | undefined {
  return FURNISHING_API_TO_KEY[apiValue];
}

export function getOutdoorSpaceTranslationKey(
  apiValue: string,
): string | undefined {
  return OUTDOOR_API_TO_KEY[apiValue];
}

export function getBillsTranslationKey(apiValue: string): string | undefined {
  return BILLS_API_TO_KEY[apiValue];
}

export function getTenantTypeTranslationKeys(apiValue: string): string[] {
  return TENANT_TYPE_API_TO_KEY[apiValue] ?? [];
}

export function getBuildingTypeTranslationKey(
  apiValue: string,
): string | undefined {
  return BUILDING_TYPE_API_TO_KEY[apiValue];
}

export function getDurationTranslationKey(
  apiValue: string,
): string | undefined {
  return DURATION_API_TO_KEY[apiValue];
}

export function getAmenityDisplayTranslationKey(
  displayName: string,
): string | undefined {
  return AMENITY_DISPLAY_TO_KEY[displayName];
}

// ==================== TENANT CV LIFESTYLE (smoke, pets, children, family) ====================

const CHILDREN_COUNT_API_TO_KEY: Record<string, string> = {
  no: "children.status.name1",
  "yes-1-child": "children.status.name2",
  "yes-2-children": "children.status.name3",
  "yes-3-plus-children": "children.status.name4",
};

const FAMILY_STATUS_API_TO_KEY: Record<string, string> = {
  couple: "family.status.name2",
  "couple-with-children": "family.status.name3",
};

const SMOKER_API_TO_KEY: Record<string, string> = {
  yes: "smoker.answer.name2",
  no: "smoker.answer.name1",
};

/** Pet display value (from API or UI) → translation key */
const PETS_DISPLAY_TO_KEY: Record<string, string> = {
  "No pets": "pet.type.name1",
  Dog: "pet.type.name2",
  Cat: "pet.type.name3",
  Other: "pet.type.name4",
  "Planning to get a pet": "pet.type.name5",
  "no pets": "pet.type.name1",
  dog: "pet.type.name2",
  cat: "pet.type.name3",
  other: "pet.type.name4",
  "planning to get a pet": "pet.type.name5",
};

export function getChildrenCountTranslationKey(
  apiValue: string,
): string | undefined {
  return CHILDREN_COUNT_API_TO_KEY[apiValue];
}

export function getFamilyStatusTranslationKey(
  apiValue: string,
): string | undefined {
  return FAMILY_STATUS_API_TO_KEY[apiValue];
}

export function getSmokerTranslationKey(apiValue: string): string | undefined {
  return SMOKER_API_TO_KEY[apiValue];
}

export function getPetsDisplayTranslationKey(
  displayValue: string,
): string | undefined {
  return PETS_DISPLAY_TO_KEY[displayValue];
}
