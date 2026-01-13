"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  updateUser,
} from "../../store/slices/authSlice";
import { authAPI } from "../../lib/api";
import { StepWrapper } from "../preferences/step-components/StepWrapper";
import { StepContainer } from "../preferences/step-components/StepContainer";
import { InputField } from "../preferences/ui/InputField";
import { SearchableDropdown } from "../preferences/ui/SearchableDropdown";
import { StyledDateInput } from "../../../shared/ui/DateInput/StyledDateInput";
import { PhoneMaskInput, Button } from "../../../shared/ui";
import {
  getCountryByDialCode,
  getCountryByCode,
  getDefaultCountry,
} from "../../../shared/lib/countries";
import { NATIONALITY_OPTIONS } from "../../../shared/lib/nationalities";
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
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    const country = getCountryByDialCode(phoneNumber.substring(0, 4)) || 
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
      const profile = user.role === "tenant" ? user.tenantProfile : user.operatorProfile;
      
      // Only prefill if profile exists and has actual saved data (not just from full_name)
      const hasSavedProfileData = profile && (
        profile.first_name || 
        profile.last_name || 
        profile.address || 
        profile.phone || 
        profile.date_of_birth || 
        profile.nationality
      );
      
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
      }
    }
  }, [user, parsePhoneNumber]);

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

    return true;
  };

  const isFormValid = validateForm();

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFormValid);
    }
  }, [isFormValid, onValidationChange]);

  const handleInputChange = useCallback(
    (field: keyof UpdateUserData, value: string | number) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSave = async () => {
    if (!isFormValid) {
      setError("Please fill in all required fields");
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      await authAPI.updateProfile(formData);
      dispatch(updateUser(formData as any));
      setSuccess("Profile saved successfully!");
      return true;
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save profile. Please try again."
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
        title="Complete Your Profile"
        description="Let's start by setting up your profile. This information helps us personalize your experience."
        compact={true}
      >
        <StepContainer compact={true}>
          {/* First Name */}
          <div className="mb-4">
            <InputField
              label="First Name"
              value={formData.first_name}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
              type="text"
            />
          </div>

          {/* Last Name */}
          <div className="mb-4">
            <InputField
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              type="text"
            />
          </div>

          {/* Address */}
          <div className="mb-4">
            <InputField
              label="Address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              type="text"
            />
          </div>

          {/* Phone */}
          <div className="mb-4">
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
          <div className="mb-4">
            <StyledDateInput
              label="Date of Birth"
              value={formData.date_of_birth || null}
              onChange={(date) => handleInputChange("date_of_birth", date)}
              maxDate={new Date().toISOString().split("T")[0]} // Today's date in YYYY-MM-DD format
              minDate="1900-01-01"
            />
          </div>

          {/* Nationality */}
          <div className="mb-4">
            <SearchableDropdown
              label="Nationality"
              value={formData.nationality ?? ""}
              options={NATIONALITY_OPTIONS}
              onChange={(value) =>
                handleInputChange("nationality", value as string)
              }
              placeholder="Select nationality"
            />
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
