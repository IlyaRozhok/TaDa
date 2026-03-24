import { useState, useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { UpdateUserData } from "@/entities/user/model/types";
import type { User } from "@/app/store/slices/authSlice";
import { buildFormDataFromUser } from "@/entities/user/lib/utils";
import { authAPI } from "@/app/lib/api";
import { updateUser } from "@/app/store/slices/authSlice";
import {
  getCountryByDialCode,
  getCountryByCode,
  getDefaultCountry,
} from "@/shared/lib/countries";

interface UseUnifiedProfileOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  autoSave?: boolean; // For onboarding, we might want manual save
  debounceMs?: number; // For auto-save functionality
}

interface UseUnifiedProfileReturn {
  // Form state
  formData: UpdateUserData;
  phoneCountryCode: string;
  phoneNumberOnly: string;
  hasChanges: boolean;
  isSaving: boolean;
  isLoading: boolean;
  dateOfBirthError: string | null;
  
  // Actions
  handleInputChange: (field: keyof UpdateUserData, value: string) => void;
  handlePhoneChange: (phoneNumber: string, countryCode: string) => void;
  validateDateOfBirth: (dateString: string) => boolean;
  validateForm: () => boolean;
  saveProfile: () => Promise<boolean>;
  resetForm: () => void;
  
  // Utilities
  parsePhoneNumber: (phoneNumber: string) => void;
}

export const useUnifiedProfile = (
  user: User | null, 
  options: UseUnifiedProfileOptions = {}
): UseUnifiedProfileReturn => {
  const dispatch = useDispatch();
  const { onSuccess, onError } = options;
  const lastUserDataRef = useRef<string>('');
  const [formData, setFormData] = useState<UpdateUserData>(() =>
    buildFormDataFromUser(user as any)
  );
  const [phoneCountryCode, setPhoneCountryCode] = useState("GB");
  const [phoneNumberOnly, setPhoneNumberOnly] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dateOfBirthError, setDateOfBirthError] = useState<string | null>(null);

  // Helper function to parse phone number
  const parsePhoneNumber = useCallback((phoneNumber: string) => {
    if (!phoneNumber) {
      setPhoneCountryCode("GB");
      setPhoneNumberOnly("");
      return;
    }

    // Try to find country by dial code
    const country = getCountryByDialCode(phoneNumber);
    if (country) {
      setPhoneCountryCode(country.code);
      setPhoneNumberOnly(phoneNumber.replace(country.dialCode, ""));
    } else {
      // Fallback to default country
      const defaultCountry = getDefaultCountry();
      setPhoneCountryCode(defaultCountry.code);
      setPhoneNumberOnly(phoneNumber);
    }
  }, []);

  // Initialize form data from user - only when user ID changes
  useEffect(() => {
    if (!user?.id) return;
    
    // Create a stable key for user data
    const userDataKey = `${user.id}-${user.updated_at || ''}`;
    
    // Skip if we've already processed this exact user data
    if (lastUserDataRef.current === userDataKey) {
      return;
    }
    
    // Mark as processed immediately to prevent re-runs
    lastUserDataRef.current = userDataKey;
    
    try {
      const newFormData = buildFormDataFromUser(user as any);
      setFormData(newFormData);
      setHasChanges(false);
      
      // Parse phone number
      const phone = user.tenantProfile?.phone || user.operatorProfile?.phone || "";
      if (phone) {
        const country = getCountryByDialCode(phone);
        if (country) {
          setPhoneCountryCode(country.code);
          setPhoneNumberOnly(phone.replace(country.dialCode, ""));
        } else {
          const defaultCountry = getDefaultCountry();
          setPhoneCountryCode(defaultCountry.code);
          setPhoneNumberOnly(phone);
        }
      } else {
        setPhoneCountryCode("GB");
        setPhoneNumberOnly("");
      }
    } catch (error) {
      console.error("useUnifiedProfile: Error initializing form data:", error);
    }
  }, [user?.id, user?.updated_at]);

  const handleInputChange = useCallback((field: keyof UpdateUserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear date error when date changes
    if (field === 'date_of_birth') {
      setDateOfBirthError(null);
    }
  }, []);

  const handlePhoneChange = useCallback((phoneNumber: string, countryCode: string) => {
    setPhoneNumberOnly(phoneNumber);
    setPhoneCountryCode(countryCode);
    
    // Get country data and construct full phone number
    const country = getCountryByCode(countryCode);
    const fullPhone = country ? `${country.dialCode}${phoneNumber}` : phoneNumber;
    
    setFormData(prev => ({ ...prev, phone: fullPhone }));
    setHasChanges(true);
  }, []);

  // Pure validation function without side effects
  const validateDateOfBirth = useCallback((dateString: string): { isValid: boolean; error: string | null } => {
    if (!dateString) {
      return { isValid: false, error: "Date of birth is required" };
    }

    const date = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    if (age < 18) {
      return { isValid: false, error: "You must be at least 18 years old" };
    }

    if (age > 100) {
      return { isValid: false, error: "Please enter a valid date of birth" };
    }

    return { isValid: true, error: null };
  }, []);

  // Helper function to validate and set error
  const validateAndSetDateError = useCallback((dateString: string): boolean => {
    const validation = validateDateOfBirth(dateString);
    setDateOfBirthError(validation.error);
    return validation.isValid;
  }, [validateDateOfBirth]);

  const validateForm = useCallback((dataToValidate?: UpdateUserData): boolean => {
    const data = dataToValidate || formData;
    const { first_name, last_name, date_of_birth } = data;

    if (!first_name?.trim()) return false;
    if (!last_name?.trim()) return false;
    if (!date_of_birth) return false;
    
    const dateValidation = validateDateOfBirth(date_of_birth);
    return dateValidation.isValid;
  }, [formData, validateDateOfBirth]);

  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    setIsSaving(true);
    setIsLoading(true);

    try {
      // Use the unified API endpoint that returns complete user data
      const response = await authAPI.updateProfile(formData);
      const updatedUser = response.data?.user;
      
      if (updatedUser) {
        dispatch(updateUser(updatedUser));
      }
      
      setHasChanges(false);
      onSuccess?.();
      return true;
    } catch (error) {
      console.error("Failed to update profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      onError?.(errorMessage);
      return false;
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  }, [formData, validateForm, dispatch, onSuccess, onError]);

  const resetForm = useCallback(() => {
    if (user) {
      const resetData = buildFormDataFromUser(user as any);
      setFormData(resetData);
      setHasChanges(false);
      setDateOfBirthError(null);
      
      // Reset phone parsing
      const phone = user.tenantProfile?.phone || user.operatorProfile?.phone || "";
      if (phone) {
        const country = getCountryByDialCode(phone);
        if (country) {
          setPhoneCountryCode(country.code);
          setPhoneNumberOnly(phone.replace(country.dialCode, ""));
        } else {
          const defaultCountry = getDefaultCountry();
          setPhoneCountryCode(defaultCountry.code);
          setPhoneNumberOnly(phone);
        }
      } else {
        setPhoneCountryCode("GB");
        setPhoneNumberOnly("");
      }
    }
  }, [user?.id, user?.updated_at]);

  return {
    // Form state
    formData,
    phoneCountryCode,
    phoneNumberOnly,
    hasChanges,
    isSaving,
    isLoading,
    dateOfBirthError,
    
    // Actions
    handleInputChange,
    handlePhoneChange,
    validateDateOfBirth: validateAndSetDateError,
    validateForm,
    saveProfile,
    resetForm,
    
    // Utilities
    parsePhoneNumber,
  };
};