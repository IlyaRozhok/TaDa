export interface PreferencesFormData {
  primary_postcode?: string;
  secondary_location?: string;
  commute_location?: string;
  commute_time_walk?: number;
  commute_time_cycle?: number;
  commute_time_tube?: number;
  move_in_date?: string;
  move_out_date?: string;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  furnishing?: string;
  let_duration?: string;
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
  hobbies?: string[];
  ideal_living_environment?: string[];
  pets?: string;
  smoker?: string;
  additional_info?: string;
  // Step 2 - New fields
  deposit_preferences?: string;
  // Step 3 - New fields (all multi-select)
  property_type_preferences?: string[];
  rooms_preferences?: string[];
  bathrooms_preferences?: string[];
  furnishing_preferences?: string[];
  outdoor_space_preferences?: string[];
  min_square_meters?: number;
  max_square_meters?: number;
  // Step 4 - New fields
  building_style_preferences?: string[];
  selected_duration?: string;
  selected_bills?: string;
  // Step 5 - New fields
  tenant_type_preferences?: string[];
  // Step 6 - New fields
  pet_type_preferences?: string[];
  number_of_pets?: string;
  dog_size?: string;
  // Step 7 - New fields
  amenities_preferences?: string[];
  additional_preferences?: string[];
}

export interface FormFieldErrors {
  [key: string]: string;
}

export interface PreferencesOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
  onUpdate: (field: keyof PreferencesFormData, value: any) => void;
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
  | "building_style";

export interface PreferencesState {
  loading: boolean;
  step: number;
  existingPreferences: unknown;
  success: boolean;
  backendErrors: FormFieldErrors;
  generalError: string;
}
