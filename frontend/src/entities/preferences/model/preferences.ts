import {
  transformBuildingTypeUIToAPI,
  transformBuildingTypeAPIToUI,
  transformTenantTypeUIToAPI,
  transformTenantTypeAPIToUI,
  transformDurationUIToAPI,
  transformDurationAPIToUI,
  transformDurationUIToAPIArray,
  transformDurationAPIToUIArray,
  transformBillsUIToAPI,
  transformBillsAPIToUI,
  transformPropertyTypeUIToAPI,
  transformPropertyTypeAPIToUI,
  transformFurnishingUIToAPI,
  transformFurnishingAPIToUI,
  transformOutdoorSpaceUIToAPI,
  transformOutdoorSpaceAPIToUI,
  transformRoomsUIToAPI,
  transformRoomsAPIToUI,
  transformBathroomsUIToAPI,
  transformBathroomsAPIToUI,
} from "../../../shared/constants/mappings";

// Pet type matching Property.pets structure
export interface Pet {
  type: "dog" | "cat" | "other";
  customType?: string;
  size?: "small" | "medium" | "large";
}

export interface PreferencesFormData {
  // ==================== LIFESTYLE PREFERENCES (NEW STEP BEFORE LOCATION) ====================
  occupation?: string;
  family_status?: string;
  children_count?: string;

  // ==================== KYC & REFERENCING ====================
  kyc_status?: string;
  referencing_status?: string;

  // ==================== STEP 1: LOCATION ====================
  preferred_areas?: string[];
  preferred_districts?: string[];
  preferred_metro_stations?: string[];

  // ==================== STEP 2: BUDGET & MOVE-IN ====================
  move_in_date?: string;
  move_out_date?: string;
  min_price?: number;
  max_price?: number;
  flexible_budget?: boolean;
  move_in_flexibility?: string; // UI: "flexible" / fixed etc.

  // ==================== STEP 3: PROPERTY & ROOMS ====================
  property_types?: string[]; // matches Property.property_type
  bedrooms?: number[]; // matches Property.bedrooms
  bathrooms?: number[]; // matches Property.bathrooms
  furnishing?: string[]; // matches Property.furnishing
  outdoor_space?: boolean; // matches Property.outdoor_space
  balcony?: boolean; // matches Property.balcony
  terrace?: boolean; // matches Property.terrace
  min_square_meters?: number;
  max_square_meters?: number;

  // ==================== STEP 4: BUILDING & DURATION ====================
  building_types?: string[]; // matches Property.building_type
  let_duration?: string; // matches Property.let_duration
  bills?: string; // matches Property.bills

  // ==================== STEP 5: TENANT TYPE ====================
  tenant_types?: string[]; // matches Property.tenant_types

  // ==================== STEP 6: PETS ====================
  pet_policy?: boolean; // matches Property.pet_policy
  pets?: Pet[]; // matches Property.pets structure
  number_of_pets?: number;

  // ==================== STEP 7: AMENITIES ====================
  amenities?: string[]; // matches Property.amenities
  is_concierge?: boolean; // matches Property.is_concierge
  smoking_area?: boolean; // matches Property.smoking_area

  // ==================== STEP 8: HOBBIES ====================
  hobbies?: string[];

  // ==================== STEP 9: LIVING ENVIRONMENT ====================
  ideal_living_environment?: string[];
  smoker?: string;

  // ==================== STEP 10: ABOUT YOU ====================
  preferred_address?: string;
  additional_info?: string;

  // ==================== LEGACY FIELDS (for backward compatibility) ====================
  // Only keeping fields that are used in transformations or matching
  commute_time_walk?: number;
  commute_time_cycle?: number;
  commute_time_tube?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;

  // ==================== UI-ONLY FIELDS (not sent to backend) ====================
  // These are used by UI components and transformed before sending
  property_type_preferences?: string[]; // UI alias for property_types
  rooms_preferences?: string[]; // UI field, transformed to bedrooms[]
  bathrooms_preferences?: string[]; // UI field, transformed to bathrooms[]
  furnishing_preferences?: string[]; // UI alias for furnishing[]
  outdoor_space_preferences?: string[]; // UI field, transformed to booleans
  building_style_preferences?: string[]; // UI alias for building_types
  selected_duration?: string[]; // UI alias for let_duration (multiselect)
  selected_bills?: string; // UI alias for bills
  tenant_type_preferences?: string[]; // UI alias for tenant_types
  pet_type_preferences?: string[]; // UI field, transformed to pets[]
  pet_additional_info?: string; // UI field for pet additional info, stored in pets[].customType
  amenities_preferences?: string[]; // UI alias for amenities
  additional_preferences?: string[]; // UI field for smoking_area and is_concierge
}

export interface FormFieldErrors {
  [key: string]: string;
}

export interface PreferencesOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FeatureSelectorProps {
  title: string;
  options: readonly PreferencesOption[];
  category: keyof PreferencesFormData;
  icon: React.ComponentType<{ className?: string }>;
  selectedFeatures: string[];
  onToggle: (feature: string) => void;
}

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
}

export interface PreferencesStepProps {
  formData: PreferencesFormData;
  errors: FormFieldErrors;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
}

export type PreferencesFeatureCategory =
  | "lifestyle_features"
  | "social_features"
  | "work_features"
  | "convenience_features"
  | "pet_friendly_features"
  | "luxury_features"
  | "building_style"
  | "amenities";

export interface PreferencesState {
  loading: boolean;
  step: number;
  existingPreferences: unknown;
  success: boolean;
  backendErrors: FormFieldErrors;
  generalError: string;
}

// Helper type for property matching
export interface PropertyMatchCriteria {
  property_type?: string;
  furnishing?: string;
  bills?: string;
  building_type?: string;
  tenant_types?: string[];
  amenities?: string[];
  is_concierge?: boolean;
  pet_policy?: boolean;
  smoking_area?: boolean;
  outdoor_space?: boolean;
  balcony?: boolean;
  terrace?: boolean;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
}

/**
 * Transform UI form data to API format before sending
 * This normalizes UI-specific fields to the backend format
 */
export function transformFormDataForApi(
  formData: PreferencesFormData,
): Partial<PreferencesFormData> {
  const apiData: Partial<PreferencesFormData> = { ...formData };

  // flexible_budget: derive from existing "Flexible" (move_in_flexibility)
  apiData.flexible_budget = formData.move_in_flexibility === "flexible";

  // Transform rooms_preferences to bedrooms array
  if (formData.rooms_preferences !== undefined) {
    apiData.bedrooms = transformRoomsUIToAPI(formData.rooms_preferences);
  }

  // Bathrooms transformation
  if (formData.bathrooms_preferences !== undefined) {
    apiData.bathrooms = transformBathroomsUIToAPI(
      formData.bathrooms_preferences,
    );
  }

  // Furnishing transformation
  if (formData.furnishing_preferences !== undefined) {
    apiData.furnishing = transformFurnishingUIToAPI(
      formData.furnishing_preferences,
    );
  }

  // Property type transformation
  if (formData.property_type_preferences !== undefined) {
    apiData.property_types = transformPropertyTypeUIToAPI(
      formData.property_type_preferences,
    );
  }

  // Outdoor space transformation
  if (formData.outdoor_space_preferences !== undefined) {
    const outdoorSpaceData = transformOutdoorSpaceUIToAPI(
      formData.outdoor_space_preferences,
    );
    if (outdoorSpaceData.outdoor_space)
      apiData.outdoor_space = outdoorSpaceData.outdoor_space;
    if (outdoorSpaceData.balcony) apiData.balcony = outdoorSpaceData.balcony;
    if (outdoorSpaceData.terrace) apiData.terrace = outdoorSpaceData.terrace;
  }

  // Building style transformation
  if (formData.building_style_preferences !== undefined) {
    apiData.building_types = transformBuildingTypeUIToAPI(
      formData.building_style_preferences,
    );
  }

  // Let duration transformation (multiselect → comma-separated API string)
  if (
    formData.selected_duration !== undefined &&
    Array.isArray(formData.selected_duration) &&
    formData.selected_duration.length > 0
  ) {
    apiData.let_duration = transformDurationUIToAPIArray(
      formData.selected_duration,
    );
  }

  // Bills transformation
  if (formData.selected_bills !== undefined) {
    apiData.bills = transformBillsUIToAPI(formData.selected_bills);
  }

  // Tenant types transformation
  if (formData.tenant_type_preferences !== undefined) {
    apiData.tenant_types = [
      ...new Set(transformTenantTypeUIToAPI(formData.tenant_type_preferences)),
    ];
  }

  // Pets transformation (normalize to dog | cat | other; ignore unknowns)
  const normalizePet = (pet: string) => {
    const p = pet?.toString().toLowerCase().trim();
    // Handle "No pets" and "Planning to get a pet" - these should not create pets
    if (p === "no pets" || p === "planning to get a pet") {
      return null;
    }
    if (p === "dog" || p === "cat" || p === "other") return p as Pet["type"];
    return null;
  };

  if (formData.pet_type_preferences !== undefined) {
    const normalizedPets =
      formData.pet_type_preferences
        ?.map(normalizePet)
        .filter((v): v is Pet["type"] => Boolean(v)) || [];

    // Check if "Planning to get a pet" is selected
    const hasPlanningToGetPet = formData.pet_type_preferences.some(
      (p) => p?.toString().toLowerCase().trim() === "planning to get a pet",
    );

    if (normalizedPets.length > 0) {
      apiData.pets = normalizedPets.map((petType) => {
        const pet: Pet = { type: petType };
        // Add customType (additional info) if provided
        if (
          formData.pet_additional_info &&
          formData.pet_additional_info.trim()
        ) {
          pet.customType = formData.pet_additional_info.trim();
        }
        return pet;
      });
      // Set pet_policy to true if we have pets
      apiData.pet_policy = true;
    } else if (hasPlanningToGetPet) {
      // If "Planning to get a pet" is selected, set pet_policy to true but no pets array
      apiData.pets = [];
      apiData.pet_policy = true;
      // Note: additional_info for "Planning to get a pet" cannot be stored in pets[].customType
      // as there are no pets yet. This is a design limitation.
    } else {
      // If no pets selected or "No pets" selected, set pet_policy to false
      apiData.pets = [];
      apiData.pet_policy = false;
    }
  }

  // number_of_pets passthrough
  if (formData.number_of_pets !== undefined && formData.number_of_pets !== null) {
    apiData.number_of_pets = formData.number_of_pets;
  }

  // Amenities: Step 7 stores admin names (Gym, Co-working, ...) – pass through to API
  if (formData.amenities_preferences !== undefined) {
    apiData.amenities = formData.amenities_preferences;
  }

  // Additional preferences transformation (smoking area, concierge) with normalization
  const normalizeAdditional = (s: string) => {
    const lower = s?.toString().toLowerCase();
    if (lower.includes("smoking")) return "smoking_area";
    if (lower.includes("concierge")) return "is_concierge";
    return null;
  };

  if (formData.additional_preferences !== undefined) {
    const normalizedAdditional =
      formData.additional_preferences
        ?.map(normalizeAdditional)
        .filter((v): v is "smoking_area" | "is_concierge" => Boolean(v)) || [];

    apiData.smoking_area = normalizedAdditional.includes("smoking_area");
    apiData.is_concierge = normalizedAdditional.includes("is_concierge");
  }

  // Normalize commute times: ensure numbers or undefined
  const commuteFields: Array<keyof PreferencesFormData> = [
    "commute_time_walk",
    "commute_time_cycle",
    "commute_time_tube",
  ];

  commuteFields.forEach((field) => {
    if (formData[field] !== undefined) {
      const value = formData[field];
      if (typeof value === "string") {
        const parsed = parseInt(value, 10);
        (apiData as any)[field] = isNaN(parsed) ? undefined : parsed;
      }
    }
  });

  // Smoker normalization (UI string -> backend string)
  // UI: "smoker" -> Backend: "yes"
  // UI: "non-smoker" -> Backend: "no"
  // UI: empty/null -> Backend: null
  if (
    formData.smoker !== undefined &&
    formData.smoker !== null &&
    formData.smoker !== ""
  ) {
    if (formData.smoker === "smoker") {
      apiData.smoker = "yes";
    } else if (formData.smoker === "non-smoker") {
      apiData.smoker = "no";
    } else {
      // If it's already a backend value, pass it through
      apiData.smoker = formData.smoker;
    }
  } else {
    // Empty/null value - set to null for backend
    apiData.smoker = null as unknown as PreferencesFormData["smoker"];
  }

  // Normalize numeric fields: min/max price, min/max square meters
  const numericFields: Array<keyof PreferencesFormData> = [
    "min_price",
    "max_price",
    "min_square_meters",
    "max_square_meters",
    "min_bedrooms",
    "max_bedrooms",
    "min_bathrooms",
    "max_bathrooms",
  ];

  numericFields.forEach((field) => {
    if (formData[field] !== undefined) {
      const value = formData[field];
      if (typeof value === "string") {
        const parsed = parseInt(value, 10);
        (apiData as any)[field] = isNaN(parsed) ? undefined : parsed;
      }
    }
  });

  return apiData;
}

/**
 * Transform API data to UI form data format
 * Maps backend fields to UI-specific fields where necessary
 */
export function transformApiDataForForm(
  apiData: Partial<PreferencesFormData>,
): PreferencesFormData {
  console.log("🔄 Starting transformApiDataForForm with:", apiData);
  
  const formData: PreferencesFormData = {
    ...apiData,
    // Ensure arrays are initialized to avoid uncontrolled inputs
    property_type_preferences: transformPropertyTypeAPIToUI(
      Array.isArray(apiData.property_types) ? apiData.property_types : [],
    ),
    rooms_preferences: [],
    bathrooms_preferences: [],
    furnishing_preferences: transformFurnishingAPIToUI(
      Array.isArray(apiData.furnishing) ? apiData.furnishing : [],
    ),
    outdoor_space_preferences: [],
    building_style_preferences: transformBuildingTypeAPIToUI(
      Array.isArray(apiData.building_types) ? apiData.building_types : [],
    ),
    selected_duration: transformDurationAPIToUIArray(
      apiData.let_duration || "",
    ),
    selected_bills: transformBillsAPIToUI(apiData.bills || ""),
    tenant_type_preferences: transformTenantTypeAPIToUI(
      Array.isArray(apiData.tenant_types) ? apiData.tenant_types : [],
    ),
    pet_type_preferences: [],
    pet_additional_info: "",
    amenities_preferences: Array.isArray(apiData.amenities) ? apiData.amenities : [],
    additional_preferences: [],
  };

  console.log("📝 Base form data created:", {
    // Lifestyle preferences
    occupation: formData.occupation,
    family_status: formData.family_status,
    children_count: formData.children_count,
    // Transformed preferences
    property_type_preferences: formData.property_type_preferences,
    furnishing_preferences: formData.furnishing_preferences,
    building_style_preferences: formData.building_style_preferences,
    selected_duration: formData.selected_duration,
    selected_bills: formData.selected_bills,
    tenant_type_preferences: formData.tenant_type_preferences,
    amenities_preferences: formData.amenities_preferences,
  });

  // Outdoor space preferences - map to UI format
  formData.outdoor_space_preferences = transformOutdoorSpaceAPIToUI(
    apiData.outdoor_space,
    apiData.balcony,
    apiData.terrace,
  );
  console.log("🏡 Outdoor space preferences:", formData.outdoor_space_preferences);

  // flexible_budget -> existing "Flexible" (move_in_flexibility)
  formData.move_in_flexibility = apiData.flexible_budget ? "flexible" : "";
  console.log("💰 Move in flexibility:", formData.move_in_flexibility);

  // Pet preferences
  if (apiData.pets && apiData.pets.length > 0) {
    formData.pet_type_preferences = apiData.pets.map((pet) => {
      const petType = pet.type;
      // Extract customType (additional info) from first pet if available
      if (pet.customType && !formData.pet_additional_info) {
        formData.pet_additional_info = pet.customType;
      }
      // Capitalize first letter for UI display
      return petType.charAt(0).toUpperCase() + petType.slice(1);
    });
    console.log("🐾 Pet preferences:", formData.pet_type_preferences, "additional info:", formData.pet_additional_info);
  } else {
    // If no pets or pet_policy is false, set to empty arrays
    formData.pet_type_preferences = [];
    formData.pet_additional_info = "";
    console.log("🐾 No pets found, setting empty arrays");
  }

  // number_of_pets roundtrip
  if (apiData.number_of_pets !== undefined) {
    formData.number_of_pets = apiData.number_of_pets as number | undefined;
    console.log("🔢 Number of pets:", formData.number_of_pets);
  }

  // Additional preferences (smoking area, concierge)
  formData.additional_preferences = [];
  if (apiData.smoking_area)
    formData.additional_preferences.push("smoking_area");
  if (apiData.is_concierge)
    formData.additional_preferences.push("is_concierge");
  console.log("➕ Additional preferences:", formData.additional_preferences);

  // Transform bedrooms and bathrooms to UI format
  if (apiData.bedrooms && apiData.bedrooms.length > 0) {
    formData.rooms_preferences = transformRoomsAPIToUI(apiData.bedrooms);
    console.log("🛏️ Rooms preferences:", formData.rooms_preferences);
  }

  if (apiData.bathrooms && apiData.bathrooms.length > 0) {
    formData.bathrooms_preferences = transformBathroomsAPIToUI(
      apiData.bathrooms,
    );
    console.log("🚿 Bathrooms preferences:", formData.bathrooms_preferences);
  }

  // Smoker mapping back to UI strings
  // Backend: "yes" -> UI: "smoker"
  // Backend: "no" -> UI: "non-smoker"
  // Backend: null/empty/other -> UI: ""
  if (apiData.smoker !== undefined && apiData.smoker !== null) {
    const smokerValue = apiData.smoker as string | boolean;
    if (smokerValue === "yes" || smokerValue === true) {
      formData.smoker = "smoker";
    } else if (smokerValue === "no" || smokerValue === false) {
      formData.smoker = "non-smoker";
    } else if (typeof smokerValue === "string") {
      // Handle other backend values or pass through if already UI format
      if (smokerValue === "smoker" || smokerValue === "non-smoker") {
        formData.smoker = smokerValue;
      } else {
        formData.smoker = "";
      }
    } else {
      formData.smoker = "";
    }
  } else {
    formData.smoker = "";
  }
  console.log("🚬 Smoker preference:", formData.smoker);

  console.log("✅ Final transformed form data:", formData);
  return formData;
}
