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
}

interface UseUnifiedProfileReturn {
  formData: UpdateUserData;
  phoneCountryCode: string;
  phoneNumberOnly: string;
  hasChanges: boolean;
  isSaving: boolean;
  isLoading: boolean;
  dateOfBirthError: string | null;
  handleInputChange: (field: keyof UpdateUserData, value: string) => void;
  handlePhoneChange: (phoneNumber: string, countryCode: string) => void;
  validateDateOfBirth: (dateString: string) => boolean;
  validateForm: () => boolean;
  saveProfile: () => Promise<boolean>;
  resetForm: () => void;
  parsePhoneNumber: (phoneNumber: string) => void;
}

const parsePhone = (phoneNumber: string): { countryCode: string; numberOnly: string } => {
  if (!phoneNumber) return { countryCode: "GB", numberOnly: "" };

  const country = getCountryByDialCode(phoneNumber);
  if (country) {
    return { countryCode: country.code, numberOnly: phoneNumber.replace(country.dialCode, "") };
  }

  const defaultCountry = getDefaultCountry();
  return { countryCode: defaultCountry.code, numberOnly: phoneNumber };
};

const getProfilePhone = (user: User): string => user.phone || "";

export const useUnifiedProfile = (
  user: User | null,
  options: UseUnifiedProfileOptions = {}
): UseUnifiedProfileReturn => {
  const dispatch = useDispatch();
  const { onSuccess, onError } = options;

  const [formData, setFormData] = useState<UpdateUserData>(() =>
    buildFormDataFromUser(user as any)
  );
  const [phoneCountryCode, setPhoneCountryCode] = useState(() => {
    const phone = user ? getProfilePhone(user) : "";
    return parsePhone(phone).countryCode;
  });
  const [phoneNumberOnly, setPhoneNumberOnly] = useState(() => {
    const phone = user ? getProfilePhone(user) : "";
    return parsePhone(phone).numberOnly;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dateOfBirthError, setDateOfBirthError] = useState<string | null>(null);

  // Track which user snapshot we've already initialized from, to avoid
  // resetting the form mid-edit when the parent re-renders with the same user.
  const initializedForRef = useRef<string | null>(null);

  // Re-initialize form when user data actually changes (e.g. after save).
  useEffect(() => {
    if (!user?.id) return;

    // Build a key from the profile fields that live in the users table.
    // The effect only fires when these values actually change (e.g. after a save).
    const key = [
      user.id,
      user.updated_at,
      user.first_name,
      user.last_name,
      user.address,
      user.phone,
      user.date_of_birth,
      user.nationality,
    ].join("|");

    if (initializedForRef.current === key) return;
    initializedForRef.current = key;

    const newFormData = buildFormDataFromUser(user as any);
    setFormData(newFormData);
    setHasChanges(false);
    setDateOfBirthError(null);

    const { countryCode, numberOnly } = parsePhone(getProfilePhone(user));
    setPhoneCountryCode(countryCode);
    setPhoneNumberOnly(numberOnly);
  }, [user]);

  const parsePhoneNumber = useCallback((phoneNumber: string) => {
    const { countryCode, numberOnly } = parsePhone(phoneNumber);
    setPhoneCountryCode(countryCode);
    setPhoneNumberOnly(numberOnly);
  }, []);

  const handleInputChange = useCallback((field: keyof UpdateUserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (field === "date_of_birth") setDateOfBirthError(null);
  }, []);

  const handlePhoneChange = useCallback((phoneNumber: string, countryCode: string) => {
    setPhoneNumberOnly(phoneNumber);
    setPhoneCountryCode(countryCode);
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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age--;

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
    if (!first_name?.trim() || !last_name?.trim()) return false;
    if (!date_of_birth) return false;

    const date = new Date(date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age--;
    return age >= 18 && age <= 100;
  }, [formData]);

  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) return false;

    setIsSaving(true);
    setIsLoading(true);

    try {
      const response = await authAPI.updateProfile(formData);
      const updatedUser = response.data?.user;

      if (updatedUser) {
        // Update Redux — updateUser will merge tenantProfile correctly
        dispatch(updateUser(updatedUser));
        // Allow the useEffect above to pick up the new data by resetting the key
        initializedForRef.current = null;
      }

      setHasChanges(false);
      onSuccess?.();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      onError?.(message);
      return false;
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  }, [formData, validateForm, dispatch, onSuccess, onError]);

  const resetForm = useCallback(() => {
    if (!user) return;
    initializedForRef.current = null; // force re-init
    const resetData = buildFormDataFromUser(user as any);
    setFormData(resetData);
    setHasChanges(false);
    setDateOfBirthError(null);
    const { countryCode, numberOnly } = parsePhone(getProfilePhone(user));
    setPhoneCountryCode(countryCode);
    setPhoneNumberOnly(numberOnly);
  }, [user]);

  return {
    formData,
    phoneCountryCode,
    phoneNumberOnly,
    hasChanges,
    isSaving,
    isLoading,
    dateOfBirthError,
    handleInputChange,
    handlePhoneChange,
    validateDateOfBirth,
    validateForm,
    saveProfile,
    resetForm,
    parsePhoneNumber,
  };
};
