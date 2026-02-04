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

interface UseUserProfileOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useUserProfile = (user: User | null, options: UseUserProfileOptions = {}) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState<UpdateUserData>(() =>
    buildFormDataFromUser(user)
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

  // Initialize phone parsing when user changes
  useEffect(() => {
    if (user?.tenantProfile?.phone || user?.operatorProfile?.phone) {
      const phone = user.tenantProfile?.phone || user.operatorProfile?.phone || "";
      parsePhoneNumber(phone);
    }
  }, [user, parsePhoneNumber]);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      const newFormData = buildFormDataFromUser(user);
      setFormData(newFormData);
      setHasChanges(false);
    }
  }, [user]);

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
    const age = today.getFullYear() - date.getFullYear();
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
      const response = await authAPI.updateProfile(formData);
      dispatch(updateUser(response.user));
      setHasChanges(false);
      options.onSuccess?.();
      return true;
    } catch (error) {
      console.error("Failed to update profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      options.onError?.(errorMessage);
      return false;
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  }, [formData, validateForm, dispatch, options]);

  const resetForm = useCallback(() => {
    if (user) {
      const resetData = buildFormDataFromUser(user);
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