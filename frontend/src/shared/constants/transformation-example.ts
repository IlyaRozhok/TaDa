/**
 * Example demonstrating the transformation between preferences UI and backend API
 * This shows how the mapping ensures backward compatibility
 */

import {
  transformFormDataForApi,
  transformApiDataForForm,
} from "../../entities/preferences/model/preferences";
import type { PreferencesFormData } from "../../entities/preferences/model/preferences";

// ==================== EXAMPLE: PREFERENCES UI DATA ====================
const examplePreferencesUIData: Partial<PreferencesFormData> = {
  // Building style preferences (UI format)
  building_style_preferences: ["BTR", "Co-living", "Professional Management"],

  // Duration (UI format)
  selected_duration: ["Short term (1–6 months)"],

  // Bills (UI format)
  selected_bills: "Include",

  // Tenant types (UI format)
  tenant_type_preferences: [
    "Professional",
    "Student",
    "Corporate tenant",
    "Family",
  ],

  // Amenities (preferences format)
  amenities_preferences: [
    "gym",
    "co-working",
    "parking",
    "pet-friendly",
    "communal-space",
  ],

  // Other preferences
  min_price: 1500,
  max_price: 3000,
  bedrooms: [1, 2],
  property_types: ["flat", "studio"],
};

// ==================== TRANSFORMATION TO API FORMAT ====================
const apiData = transformFormDataForApi(examplePreferencesUIData);

console.log("=== TRANSFORMATION RESULTS ===");
console.log(
  "Original UI building_style_preferences:",
  examplePreferencesUIData.building_style_preferences,
);
console.log("Transformed API building_types:", apiData.building_types);

console.log(
  "\nOriginal UI selected_duration:",
  examplePreferencesUIData.selected_duration,
);
console.log("Transformed API let_duration:", apiData.let_duration);

console.log(
  "\nOriginal UI selected_bills:",
  examplePreferencesUIData.selected_bills,
);
console.log("Transformed API bills:", apiData.bills);

console.log(
  "\nOriginal UI tenant_type_preferences:",
  examplePreferencesUIData.tenant_type_preferences,
);
console.log("Transformed API tenant_types:", apiData.tenant_types);

console.log(
  "\nOriginal UI amenities_preferences:",
  examplePreferencesUIData.amenities_preferences,
);
console.log("Transformed API amenities:", apiData.amenities);

// ==================== EXAMPLE: BACKEND API DATA ====================
const exampleBackendData: Partial<PreferencesFormData> = {
  // Backend format (snake_case, admin form values)
  building_types: ["btr", "co_living", "professional_management"],
  let_duration: "short_term",
  bills: "included",
  tenant_types: ["corporateLets", "student", "family"],
  amenities: ["Gym", "Co-working", "Parking", "Pet areas"],

  // Other data
  min_price: 1500,
  max_price: 3000,
  bedrooms: [1, 2],
  property_types: ["flat", "studio"],
};

// ==================== TRANSFORMATION TO UI FORMAT ====================
const uiData = transformApiDataForForm(exampleBackendData);

console.log("\n=== REVERSE TRANSFORMATION RESULTS ===");
console.log("Original API building_types:", exampleBackendData.building_types);
console.log(
  "Transformed UI building_style_preferences:",
  uiData.building_style_preferences,
);

console.log("\nOriginal API let_duration:", exampleBackendData.let_duration);
console.log("Transformed UI selected_duration:", uiData.selected_duration);

console.log("\nOriginal API bills:", exampleBackendData.bills);
console.log("Transformed UI selected_bills:", uiData.selected_bills);

console.log("\nOriginal API tenant_types:", exampleBackendData.tenant_types);
console.log(
  "Transformed UI tenant_type_preferences:",
  uiData.tenant_type_preferences,
);

console.log("\nOriginal API amenities:", exampleBackendData.amenities);
console.log(
  "Transformed UI amenities_preferences:",
  uiData.amenities_preferences,
);

// ==================== MATCHING COMPATIBILITY ====================
console.log("\n=== MATCHING COMPATIBILITY ===");
console.log("Backend matching will now work correctly because:");
console.log(
  "1. building_types are in snake_case format:",
  apiData.building_types,
);
console.log("2. tenant_types use admin form values:", apiData.tenant_types);
console.log("3. let_duration uses enum values:", apiData.let_duration);
console.log("4. bills uses enum values:", apiData.bills);
console.log("5. amenities use admin form values:", apiData.amenities);

export { examplePreferencesUIData, exampleBackendData };
