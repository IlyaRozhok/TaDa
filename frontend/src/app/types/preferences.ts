// Pet type matching Property.pets structure
export interface Pet {
  type: "dog" | "cat" | "other";
  customType?: string;
  size?: "small" | "medium" | "large";
}

export interface PreferencesFormData {
  // ==================== STEP 1: LOCATION ====================
  preferred_address?: string;
  preferred_metro_stations?: string[];
  preferred_essentials?: string[];
  preferred_commute_times?: string[];

  // ==================== STEP 2: BUDGET & MOVE-IN ====================
  move_in_date?: string;
  move_out_date?: string;
  min_price?: number;
  max_price?: number;
  deposit_preference?: string; // "yes" | "no"

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
  additional_info?: string;

  // ==================== LEGACY FIELDS (for backward compatibility) ====================
  primary_postcode?: string;
  secondary_location?: string;
  commute_location?: string;
  commute_time_walk?: number;
  commute_time_cycle?: number;
  commute_time_tube?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  property_type?: string[];
  building_style?: string[];
  designer_furniture?: boolean;
  house_shares?: string;
  date_property_added?: string;
  lifestyle_features?: string[];
  social_features?: string[];
  work_features?: string[];
  convenience_features?: string[];
  pet_friendly_features?: string[];
  luxury_features?: string[];
  pets_legacy?: string; // old single string format

  // ==================== UI-ONLY FIELDS (not sent to backend) ====================
  // These are used by UI components and transformed before sending
  property_type_preferences?: string[]; // UI alias for property_types
  rooms_preferences?: string[]; // UI field, transformed to bedrooms[]
  bathrooms_preferences?: string[]; // UI field, transformed to bathrooms[]
  furnishing_preferences?: string[]; // UI alias for furnishing[]
  outdoor_space_preferences?: string[]; // UI field, transformed to booleans
  building_style_preferences?: string[]; // UI alias for building_types
  selected_duration?: string; // UI alias for let_duration
  selected_bills?: string; // UI alias for bills
  tenant_type_preferences?: string[]; // UI alias for tenant_types
  pet_type_preferences?: string[]; // UI field, transformed to pets[]
  dog_size?: string; // UI field, used in pets[] transformation
  amenities_preferences?: string[]; // UI alias for amenities
  additional_preferences?: string[]; // UI field for smoking_area and is_concierge
  deposit_preferences?: string; // UI alias for deposit_preference
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
export function transformFormDataForApi(formData: PreferencesFormData): Partial<PreferencesFormData> {
  const apiData: Partial<PreferencesFormData> = { ...formData };

  // Transform rooms_preferences to bedrooms array (always set, even if empty)
  // Check if field exists in formData (including empty arrays)
  if (formData.rooms_preferences !== undefined) {
    apiData.bedrooms = formData.rooms_preferences.length > 0
      ? formData.rooms_preferences.map((room) => {
          if (room === "5+") return 5;
          return parseInt(room, 10);
        })
      : [];
  }

  // Transform bathrooms_preferences to bathrooms array (always set, even if empty)
  // Check if field exists in formData (including empty arrays)
  if (formData.bathrooms_preferences !== undefined) {
    apiData.bathrooms = formData.bathrooms_preferences.length > 0
      ? formData.bathrooms_preferences.map((bath) => {
          if (bath === "4+") return 4;
          return parseInt(bath, 10);
        })
      : [];
  }

  // Transform property_type_preferences to property_types (always set, even if empty)
  if (formData.property_type_preferences !== undefined) {
    apiData.property_types = formData.property_type_preferences.length > 0
      ? formData.property_type_preferences.map((type) =>
          type.toLowerCase().replace(/\s+/g, "_")
        )
      : [];
  }

  // Transform furnishing_preferences to furnishing (always set, even if empty)
  if (formData.furnishing_preferences !== undefined) {
    apiData.furnishing = formData.furnishing_preferences.length > 0
      ? formData.furnishing_preferences
      : [];
  }

  // Transform outdoor_space_preferences to booleans (always set all three)
  if (formData.outdoor_space_preferences !== undefined) {
    apiData.outdoor_space = formData.outdoor_space_preferences.includes("Outdoor Space");
    apiData.balcony = formData.outdoor_space_preferences.includes("Balcony");
    apiData.terrace = formData.outdoor_space_preferences.includes("Terrace") || 
                      formData.outdoor_space_preferences.includes("Teracce");
  }

  // Transform building_style_preferences to building_types
  if (formData.building_style_preferences?.length) {
    apiData.building_types = formData.building_style_preferences.map((style) => {
      const normalized = style.toLowerCase().replace(/\s+/g, "_");
      if (normalized === "professional_management") return "professional_management";
      if (normalized === "btr") return "btr";
      if (normalized === "co-living") return "co-living";
      return normalized;
    });
  }

  // Transform selected_duration to let_duration
  if (formData.selected_duration) {
    const duration = formData.selected_duration.toLowerCase();
    if (duration.includes("long") || duration.includes("6+")) {
      apiData.let_duration = "long_term";
    } else if (duration.includes("short") || duration.includes("1+")) {
      apiData.let_duration = "short_term";
    } else {
      apiData.let_duration = "flexible";
    }
  }

  // Transform selected_bills to bills
  if (formData.selected_bills) {
    apiData.bills = formData.selected_bills.toLowerCase() === "include" ? "included" : "excluded";
  }

  // Transform tenant_type_preferences to tenant_types
  if (formData.tenant_type_preferences?.length) {
    apiData.tenant_types = formData.tenant_type_preferences.map((type) => {
      const normalized = type.toLowerCase().replace(/\s+/g, "");
      if (normalized.includes("corporate")) return "corporateLets";
      if (normalized.includes("sharer")) return "sharers";
      if (normalized.includes("student")) return "student";
      if (normalized.includes("family")) return "family";
      if (normalized.includes("elder")) return "elder";
      return type;
    });
  }

  // Transform pet_type_preferences to pet_policy and pets
  if (formData.pet_type_preferences?.length) {
    const petType = formData.pet_type_preferences[0];
    if (petType === "No pets") {
      apiData.pet_policy = false;
      apiData.pets = [];
    } else if (petType) {
      apiData.pet_policy = true;
      const pet: Pet = {
        type: petType.toLowerCase() === "dog" ? "dog" : 
              petType.toLowerCase() === "cat" ? "cat" : "other",
      };
      if (petType.toLowerCase() === "other" || petType === "Planning to get a pet") {
        pet.customType = petType;
      }
      if (formData.dog_size && petType.toLowerCase() === "dog") {
        if (formData.dog_size.includes("Small")) pet.size = "small";
        else if (formData.dog_size.includes("Medium")) pet.size = "medium";
        else if (formData.dog_size.includes("Large")) pet.size = "large";
      }
      apiData.pets = [pet];
    }
  }

  // Transform number_of_pets from string to number
  if (formData.number_of_pets !== undefined) {
    apiData.number_of_pets = typeof formData.number_of_pets === "string" 
      ? parseInt(formData.number_of_pets, 10) || undefined
      : formData.number_of_pets;
  }

  // Transform amenities_preferences to amenities
  if (formData.amenities_preferences?.length) {
    apiData.amenities = formData.amenities_preferences;
  }

  // Transform additional_preferences to is_concierge and smoking_area (always set, even if empty)
  if (formData.additional_preferences !== undefined) {
    apiData.is_concierge = formData.additional_preferences.includes("Concierge");
    apiData.smoking_area = formData.additional_preferences.includes("Smoking Area");
  }

  // Transform deposit_preferences to deposit_preference
  if (formData.deposit_preferences) {
    apiData.deposit_preference = formData.deposit_preferences;
  }

  // Clean up UI-only fields before sending
  delete apiData.property_type_preferences;
  delete apiData.rooms_preferences;
  delete apiData.bathrooms_preferences;
  delete apiData.furnishing_preferences;
  delete apiData.outdoor_space_preferences;
  delete apiData.building_style_preferences;
  delete apiData.selected_duration;
  delete apiData.selected_bills;
  delete apiData.tenant_type_preferences;
  delete apiData.pet_type_preferences;
  delete apiData.dog_size;
  delete apiData.amenities_preferences;
  delete apiData.additional_preferences;
  delete apiData.deposit_preferences;

  return apiData;
}

/**
 * Transform API data to UI form format
 * This converts backend format to UI-friendly format
 */
export function transformApiDataForForm(apiData: Partial<PreferencesFormData>): PreferencesFormData {
  const formData: PreferencesFormData = { ...apiData };

  // Transform bedrooms to rooms_preferences (always set, even if empty)
  if (apiData.bedrooms !== undefined) {
    formData.rooms_preferences = apiData.bedrooms.length > 0
      ? apiData.bedrooms.map((b) => (b >= 5 ? "5+" : b.toString()))
      : [];
  }

  // Transform bathrooms to bathrooms_preferences (always set, even if empty)
  if (apiData.bathrooms !== undefined) {
    formData.bathrooms_preferences = apiData.bathrooms.length > 0
      ? apiData.bathrooms.map((b) => (b >= 4 ? "4+" : b.toString()))
      : [];
  }

  // Transform property_types to property_type_preferences (always set, even if empty)
  if (apiData.property_types !== undefined) {
    formData.property_type_preferences = apiData.property_types.length > 0
      ? apiData.property_types.map((type) =>
          type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")
        )
      : [];
  }

  // Transform furnishing to furnishing_preferences (always set, even if empty)
  if (apiData.furnishing !== undefined) {
    formData.furnishing_preferences = apiData.furnishing.length > 0
      ? apiData.furnishing
      : [];
  }

  // Transform booleans to outdoor_space_preferences (always set, even if empty)
  const outdoorPrefs: string[] = [];
  if (apiData.outdoor_space) outdoorPrefs.push("Outdoor Space");
  if (apiData.balcony) outdoorPrefs.push("Balcony");
  // Use "Teracce" to match UI option name
  if (apiData.terrace) outdoorPrefs.push("Teracce");
  // Always set the array, even if empty (when all booleans are false)
  formData.outdoor_space_preferences = outdoorPrefs;

  // Transform building_types to building_style_preferences
  if (apiData.building_types?.length) {
    formData.building_style_preferences = apiData.building_types.map((type) => {
      if (type === "professional_management") return "Professional Management";
      if (type === "btr") return "BTR";
      if (type === "co-living") return "Co-living";
      return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
    });
  }

  // Transform let_duration to selected_duration
  if (apiData.let_duration) {
    if (apiData.let_duration === "long_term") formData.selected_duration = "Long term 6+ m";
    else if (apiData.let_duration === "short_term") formData.selected_duration = "Short term 1+ m";
    else formData.selected_duration = "Any";
  }

  // Transform bills to selected_bills
  if (apiData.bills) {
    formData.selected_bills = apiData.bills === "included" ? "Include" : "Exclude";
  }

  // Transform tenant_types to tenant_type_preferences
  if (apiData.tenant_types?.length) {
    formData.tenant_type_preferences = apiData.tenant_types.map((type) => {
      if (type === "corporateLets") return "Corporate Lets";
      if (type === "sharers") return "Sharers";
      if (type === "student") return "Student";
      if (type === "family") return "Family";
      if (type === "elder") return "Elder";
      return type;
    });
  }

  // Transform pets to pet_type_preferences and dog_size
  if (apiData.pets?.length) {
    const pet = apiData.pets[0];
    if (pet.type === "dog") formData.pet_type_preferences = ["Dog"];
    else if (pet.type === "cat") formData.pet_type_preferences = ["Cat"];
    else formData.pet_type_preferences = [pet.customType || "Other"];

    if (pet.size) {
      if (pet.size === "small") formData.dog_size = "Small (<10kg)";
      else if (pet.size === "medium") formData.dog_size = "Medium (10-25kg)";
      else if (pet.size === "large") formData.dog_size = "Large (>25kg)";
    }
  } else if (apiData.pet_policy === false) {
    formData.pet_type_preferences = ["No pets"];
  }

  // Transform number_of_pets to string for UI
  if (apiData.number_of_pets !== undefined && apiData.number_of_pets !== null) {
    formData.number_of_pets = apiData.number_of_pets;
  }

  // Transform amenities to amenities_preferences
  if (apiData.amenities?.length) {
    formData.amenities_preferences = apiData.amenities;
  }

  // Transform is_concierge and smoking_area to additional_preferences (always set, even if empty)
  const additionalPrefs: string[] = [];
  if (apiData.is_concierge) additionalPrefs.push("Concierge");
  if (apiData.smoking_area) additionalPrefs.push("Smoking Area");
  // Always set the array, even if empty (when both booleans are false)
  formData.additional_preferences = additionalPrefs;

  // Transform deposit_preference to deposit_preferences
  if (apiData.deposit_preference) {
    formData.deposit_preferences = apiData.deposit_preference;
  }

  return formData;
}
