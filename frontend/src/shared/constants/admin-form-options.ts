/**
 * Shared constants for admin forms (Building and Property creation/editing)
 * These should be used instead of hardcoded arrays in components
 */

// ==================== TENANT TYPES ====================
export const TENANT_TYPE_OPTIONS = [
  { value: "corporateLets", label: "Corporate Lets" },
  { value: "sharers", label: "Sharers" },
  { value: "student", label: "Student" },
  { value: "family", label: "Family" },
  { value: "elder", label: "Elder" },
] as const;

// ==================== AMENITIES ====================
// Same categories and values as preferences Step 7 (AmenitiesStep) for consistency.
export const AMENITIES_BY_CATEGORY = [
  {
    title: "Facilities & Workspace",
    values: [
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
    ],
  },
  {
    title: "Services & Community",
    values: [
      "Maintenance",
      "Events calendar",
      "Pet areas",
      "Kids' room",
      "Garden",
    ],
  },
  {
    title: "Lifestyle & Culture",
    values: ["Reading", "Music", "Art"],
  },
  {
    title: "Outdoor & Activities",
    values: ["Hiking", "Cooking"],
  },
  {
    title: "Wellbeing & Sport",
    values: ["Travel", "Sport"],
  },
] as const;

/** Flat list of all amenities (for backward compatibility and simple dropdowns). */
export const AMENITIES_OPTIONS: readonly string[] =
  AMENITIES_BY_CATEGORY.flatMap((s) => s.values);

// ==================== BUILDING UNIT TYPES (Type of Unit) ====================
// Same 6 options as preferences Step 3 (Property type). Form stores UI strings; save/load via mappings.
export const TYPE_OF_UNIT_OPTIONS = [
  "Apartment",
  "Flat",
  "Studio",
  "Penthouse",
  "En-suite room",
  "Room",
] as const;

// ==================== PROPERTY TYPES ====================
export const PROPERTY_TYPE_OPTIONS = [
  { value: "apartment", label: "Apartment" },
  { value: "flat", label: "Flat" },
  { value: "studio", label: "Studio" },
  { value: "penthouse", label: "Penthouse" },
  { value: "room", label: "Room" },
  { value: "house", label: "House" },
] as const;

// ==================== FURNISHING OPTIONS ====================
export const FURNISHING_OPTIONS = [
  { value: "furnished", label: "Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "part_furnished", label: "Part-furnished" },
  { value: "designer_furniture", label: "Designer furniture" },
] as const;

// ==================== OUTDOOR SPACE OPTIONS ====================
export const OUTDOOR_SPACE_OPTIONS = [
  { value: "outdoor_space", label: "Outdoor Space" },
  { value: "balcony", label: "Balcony" },
  { value: "terrace", label: "Terrace" },
] as const;

// ==================== ROOMS/BEDROOMS OPTIONS ====================
export const BEDROOMS_OPTIONS = [
  { value: 0, label: "Studio" },
  { value: 1, label: "1 bedroom" },
  { value: 2, label: "2 bedrooms" },
  { value: 3, label: "3 bedrooms" },
  { value: 4, label: "4 bedrooms" },
  { value: 5, label: "5+ bedrooms" },
] as const;

// ==================== BATHROOMS OPTIONS ====================
export const BATHROOMS_OPTIONS = [
  { value: 1, label: "1 bathroom" },
  { value: 2, label: "2 bathrooms" },
  { value: 3, label: "3 bathrooms" },
  { value: 4, label: "4+ bathrooms" },
] as const;

// ==================== AREAS ====================
export const AREA_OPTIONS = [
  "West",
  "East",
  "North",
  "South",
  "Center",
] as const;

// ==================== LONDON DISTRICTS ====================
export const LONDON_DISTRICTS = [
  "Barking and Dagenham",
  "Barnet",
  "Bexley",
  "Brent",
  "Bromley",
  "Camden",
  "Croydon",
  "Ealing",
  "Enfield",
  "Greenwich",
  "Hackney",
  "Hammersmith and Fulham",
  "Haringey",
  "Harrow",
  "Havering",
  "Hillingdon",
  "Hounslow",
  "Islington",
  "Kensington and Chelsea",
  "Kingston upon Thames",
  "Lambeth",
  "Lewisham",
  "Merton",
  "Newham",
  "Redbridge",
  "Richmond upon Thames",
  "Southwark",
  "Sutton",
  "Tower Hamlets",
  "Waltham Forest",
  "Wandsworth",
  "Westminster",
  "City of London",
] as const;

// ==================== PET TYPES ====================
export const PET_TYPE_OPTIONS = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "other", label: "Other" },
] as const;

export const PET_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
] as const;
