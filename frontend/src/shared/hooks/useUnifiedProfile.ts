import { useState, useCallback, useEffect } from "react";
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

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      const newFormData = buildFormDataFromUser(user as any);
      setFormData(newFormData);
      setHasChanges(false);
      
      // Parse phone number when user data changes
      const phone = user.tenantProfile?.phone || user.operatorProfile?.phone || "";
      if (phone) {
        // Inline phone parsing to avoid dependency issues
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
  }, [user?.id, user?.updated_at, user?.tenantProfile, user?.operatorProfile]);

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

  const validateDateOfBirth = useCallback((dateString: string): boolean => {
    if (!dateString) {
      setDateOfBirthError("Date of birth is required");
      return false;
    }

    const date = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    if (age < 18) {
      setDateOfBirthError("You must be at least 18 years old");
      return false;
    }

    if (age > 100) {
      setDateOfBirthError("Please enter a valid date of birth");
      return false;
    }

    setDateOfBirthError(null);
    return true;
  }, []);

  const validateForm = useCallback((): boolean => {
    const { first_name, last_name, date_of_birth } = formData;

    if (!first_name?.trim()) return false;
    if (!last_name?.trim()) return false;
    if (!date_of_birth) return false;
    if (!validateDateOfBirth(date_of_birth)) return false;

    return true;
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
      parsePhoneNumber(phone);
    }
  }, [user, parsePhoneNumber]);

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
    validateDateOfBirth,
    validateForm,
    saveProfile,
    resetForm,
    
    // Utilities
    parsePhoneNumber,
  };
};