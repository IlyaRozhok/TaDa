"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  updateUser,
  setIsOnboarded,
} from "../../store/slices/authSlice";
import { authAPI } from "../../lib/api";
import { useTranslation } from "../../hooks/useTranslation";
import { wizardKeys } from "../../lib/translationsKeys/wizardTranslationKeys";
import { StepWrapper } from "../preferences/step-components/StepWrapper";
import { StepContainer } from "../preferences/step-components/StepContainer";
import { InputField } from "../preferences/ui/InputField";
import { StyledDateInput } from "../../../shared/ui/DateInput/StyledDateInput";
import { PhoneMaskInput, Button, CountryDropdown } from "../../../shared/ui";
import {
  getCountryByDialCode,
  getCountryByCode,
  getDefaultCountry,
} from "../../../shared/lib/countries";
import { buildFormDataFromUser } from "../../../entities/user/lib/utils";
import { User as UserType } from "../../../entities/user/model/types";

interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  address?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
}

interface OnboardingProfileStepProps {
  onComplete: () => void;
  isLoading?: boolean;
  onNext?: () => void;
  currentStep?: number;
  totalSteps?: number;
  onValidationChange?: (isValid: boolean) => void;
  onSave?: () => Promise<boolean>;
}

export default function OnboardingProfileStep({
  onComplete,
  isLoading: externalLoading,
  onNext,
  currentStep,
  totalSteps,
  onValidationChange,
  onSave,
}: OnboardingProfileStepProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dateOfBirthError, setDateOfBirthError] = useState<string | null>(null);
  const [phoneCountryCode, setPhoneCountryCode] = useState("GB"); // Default to GB
  const [phoneNumberOnly, setPhoneNumberOnly] = useState(""); // Store phone number without country code

  const [formData, setFormData] = useState<UpdateUserData>({
    first_name: "",
    last_name: "",
    address: "",
    phone: "",
    date_of_birth: "",
    nationality: "",
  });

  // Helper function to parse phone number
  const parsePhoneNumber = useCallback((phoneNumber: string) => {
    if (!phoneNumber) {
      setPhoneCountryCode("GB");
      setPhoneNumberOnly("");
      return;
    }

    // Try to find country by dial code from the phone number
    const country =
      getCountryByDialCode(phoneNumber.substring(0, 4)) ||
      getCountryByDialCode(phoneNumber.substring(0, 3)) ||
      getCountryByDialCode(phoneNumber.substring(0, 2)) ||
      getDefaultCountry();

    setPhoneCountryCode(country.code);
    setPhoneNumberOnly(phoneNumber.slice(country.dialCode.length));
  }, []);

  // Fill form with saved user data when component mounts or user changes
  // Only fill if user has actual saved profile data (not just full_name from Google)
  useEffect(() => {
    if (user) {
      const profile =
        user.role === "tenant" ? user.tenantProfile : user.operatorProfile;

      // Only prefill if profile exists and has actual saved data (not just from full_name)
      const hasSavedProfileData =
        profile &&
        (profile.first_name ||
          profile.last_name ||
          profile.address ||
          profile.phone ||
          profile.date_of_birth ||
          profile.nationality);

      if (hasSavedProfileData) {
        const savedData = buildFormDataFromUser(user as UserType);

        setFormData((prev) => ({
          first_name: savedData.first_name || prev.first_name,
          last_name: savedData.last_name || prev.last_name,
          address: savedData.address || prev.address,
          phone: savedData.phone || prev.phone,
          date_of_birth: savedData.date_of_birth || prev.date_of_birth,
          nationality: savedData.nationality || prev.nationality,
        }));

        // Parse phone number if available
        if (savedData.phone) {
          parsePhoneNumber(savedData.phone);
        }

        // Validate age for existing date_of_birth
        if (savedData.date_of_birth) {
          const ageError = validateAge(savedData.date_of_birth);
          setDateOfBirthError(ageError);
        }
      }
    }
  }, [user, parsePhoneNumber]);

  // Validate age (must be 18+)
  const validateAge = (dateOfBirth: string | null): string | null => {
    if (!dateOfBirth) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const birthDate = new Date(dateOfBirth);
    birthDate.setHours(0, 0, 0, 0);

    // Check if date is in the future
    if (birthDate > today) {
      return "Date of birth cannot be in the future";
    }

    // Check if date is too old (more than 120 years)
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 120);
    minDate.setHours(0, 0, 0, 0);
    if (birthDate < minDate) {
      return "Please enter a valid date of birth";
    }

    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      return "You must be at least 18 years old to register";
    }

    return null;
  };

  // Form validation
  const validateForm = (): boolean => {
    const requiredFields = [
      "first_name",
      "last_name",
      "address",
      "phone",
      "date_of_birth",
      "nationality",
    ] as const;

    for (const field of requiredFields) {
      if (!formData[field] || String(formData[field]).trim() === "") {
        return false;
      }
    }

    // Validate age
    const ageError = validateAge(formData.date_of_birth || null);
    if (ageError) {
      return false;
    }

    return true;
  };

  const isFormValid = validateForm() && !dateOfBirthError;

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFormValid);
    }
  }, [isFormValid, dateOfBirthError, onValidationChange]);

  const handleInputChange = useCallback(
    (field: keyof UpdateUserData, value: string | number) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleSave = async () => {
    if (!isFormValid) {
      if (dateOfBirthError) {
        setError(dateOfBirthError);
      } else {
        setError("Please fill in all required fields");
      }
      return false;
    }

    setIsSaving(true);
    setError(null);
    setDateOfBirthError(null);

    try {
      const response = await authAPI.updateProfile(formData);
      // Get updated user data from response
      const updatedUser = response.data?.user || response.data;

      if (updatedUser) {
        // Update user with full data from server
        dispatch(updateUser(updatedUser));
      } else {
        // Fallback: update with form data
        dispatch(updateUser(formData as any));
      }

      // Set isOnboarded to true after profile is saved
      dispatch(setIsOnboarded(true));
      setSuccess("Profile saved successfully!");
      return true;
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save profile. Please try again.",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Expose the save function to parent component
  useEffect(() => {
    (window as any).onboardingProfileSave = handleSave;
    return () => {
      delete (window as any).onboardingProfileSave;
    };
  }, [handleSave]);

  if (!isAuthenticated || !user) {
    return null;
  }

  // Clear error/success messages after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div>
      <StepWrapper
        title={t(wizardKeys.profile.title)}
        description={t(wizardKeys.profile.subtitle)}
        compact={true}
      >
        <StepContainer compact={true}>
          <div className="flex flex-col gap-2 sm:gap-4">
            {/* First Name */}
            <div>
              <InputField
                label={t(wizardKeys.profile.name)}
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                type="text"
              />
            </div>

            {/* Last Name */}
            <div>
              <InputField
                label={t(wizardKeys.profile.lastName)}
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                type="text"
              />
            </div>

            {/* Address */}
            <div>
              <InputField
                label={t(wizardKeys.profile.address)}
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                type="text"
              />
            </div>

            {/* Phone */}
            <div>
              <PhoneMaskInput
                countryCode={phoneCountryCode}
                label="Phone Number"
                value={phoneNumberOnly}
                onChange={(value) => {
                  setPhoneNumberOnly(value || "");
                  // Combine country code with phone number for storage
                  // Don't strip formatting here - let InputMask handle it internally
                  const country =
                    getCountryByCode(phoneCountryCode) || getDefaultCountry();
                  if (value) {
                    // Only extract digits when we need to store the final value
                    const digitsOnly = value.replace(/\D/g, "");
                    const fullPhoneNumber = `${country.dialCode}${digitsOnly}`;
                    handleInputChange("phone", fullPhoneNumber);
                  } else {
                    handleInputChange("phone", "");
                  }
                }}
                onCountryChange={(countryCode) => {
                  setPhoneCountryCode(countryCode);
                  // Clear the phone input when country changes
                  setPhoneNumberOnly("");
                  handleInputChange("phone", "");
                }}
              />
            </div>

            {/* Date of Birth */}
            <div>
              <StyledDateInput
                label={t(wizardKeys.profile.birth.title)}
                placeholder={t(wizardKeys.profile.birth.text)}
                value={formData.date_of_birth || null}
                onChange={(date) => {
                  // Always update the form data, even if invalid
                  // This allows the user to see what they typed and get validation feedback
                  handleInputChange("date_of_birth", date);

                  // Validate age after update
                  const ageError = validateAge(date);
                  setDateOfBirthError(ageError);
                }}
                maxDate={(() => {
                  // Maximum date: 18 years ago (user must be 18+)
                  const maxDate = new Date();
                  maxDate.setFullYear(maxDate.getFullYear() - 18);
                  return maxDate.toISOString().split("T")[0];
                })()}
                minDate={(() => {
                  // Minimum date: 120 years ago
                  const minDate = new Date();
                  minDate.setFullYear(minDate.getFullYear() - 120);
                  return minDate.toISOString().split("T")[0];
                })()}
                error={dateOfBirthError || undefined}
              />
            </div>

            {/* Nationality */}
            <div>
              <CountryDropdown
                label="Nationality"
                value={formData.nationality ?? undefined}
                onChange={(value) => handleInputChange("nationality", value)}
                placeholder={t(wizardKeys.profile.nationality)}
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs sm:text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs sm:text-sm text-green-600">{success}</p>
            </div>
          )}
        </StepContainer>
      </StepWrapper>
    </div>
  );
}
