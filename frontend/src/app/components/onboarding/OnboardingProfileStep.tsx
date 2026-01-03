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
import { GlassmorphismDropdown } from "../preferences/ui/GlassmorphismDropdown";
import { StyledDateInput } from "../../../shared/ui/DateInput/StyledDateInput";
import { PhoneMaskInput, Button } from "../../../shared/ui";
import { getCountryByDialCode, getCountryByCode, getDefaultCountry } from "../../../shared/lib/countries";
import { NATIONALITY_OPTIONS } from "../../../shared/lib/nationalities";

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
}

export default function OnboardingProfileStep({
  onComplete,
  isLoading: externalLoading,
  onNext,
  currentStep,
  totalSteps,
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

  useEffect(() => {
    if (user) {
      const profile =
        user.role === "tenant" ? user.tenantProfile : user.operatorProfile;

      const splitFullName = (full?: string | null) => {
        if (!full) return { first: "", last: "" };
        const parts = full.trim().split(" ");
        if (parts.length === 1) return { first: parts[0], last: "" };
        const [first, ...rest] = parts;
        return { first, last: rest.join(" ") };
      };

      const nameFallback = splitFullName(
        (profile as any)?.full_name || user.full_name
      );

      let formattedDateOfBirth = "";
      // Check if profile has date_of_birth (for tenant profile)
      const dateOfBirth = (profile as any)?.date_of_birth;
      if (dateOfBirth) {
        try {
          const date = new Date(dateOfBirth);
          if (!isNaN(date.getTime())) {
            formattedDateOfBirth = date.toISOString().split("T")[0];
          }
        } catch (error) {
          console.warn("Error formatting date_of_birth:", error);
        }
      }

      const initialData = {
        first_name: (profile as any)?.first_name || nameFallback.first || "",
        last_name: (profile as any)?.last_name || nameFallback.last || "",
        address: (profile as any)?.address || "",
        phone: profile?.phone || "",
        date_of_birth: formattedDateOfBirth,
        nationality: (profile as any)?.nationality || "",
        occupation: (profile as any)?.occupation || "",
      };
      setFormData(initialData);

      // Parse existing phone number to extract country code and number
      if (initialData.phone) {
        // Try to find country by dial code from the phone number
        const country = getCountryByDialCode(initialData.phone.substring(0, 4)) || 
                       getCountryByDialCode(initialData.phone.substring(0, 3)) || 
                       getCountryByDialCode(initialData.phone.substring(0, 2)) ||
                       getDefaultCountry();
        
        setPhoneCountryCode(country.code);
        setPhoneNumberOnly(initialData.phone.slice(country.dialCode.length));
      }
    }
  }, [user]);

  // Form validation
  const validateForm = (): boolean => {
    const requiredFields = ['first_name', 'last_name', 'address', 'phone', 'date_of_birth', 'nationality'] as const;
    
    for (const field of requiredFields) {
      if (!formData[field] || String(formData[field]).trim() === '') {
        return false;
      }
    }
    
    return true;
  };

  const isFormValid = validateForm();

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
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await authAPI.updateProfile(formData);
      dispatch(updateUser(formData as any));
      setSuccess("Profile saved successfully!");
      
      // Clear success message after 2 seconds and proceed to next step
      setTimeout(() => {
        setSuccess(null);
        onComplete();
      }, 1500);
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

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
      >
        <StepContainer>
          {/* First Name */}
          <div className="mb-6">
            <InputField
              label="First Name"
              value={formData.first_name}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
              type="text"
              required
            />
          </div>

          {/* Last Name */}
          <div className="mb-6">
            <InputField
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              type="text"
              required
            />
          </div>

          {/* Address */}
          <div className="mb-6">
            <InputField
              label="Address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              type="text"
              required
            />
          </div>

          {/* Phone */}
          <div className="mb-6">
            <PhoneMaskInput
              countryCode={phoneCountryCode}
              label="Phone Number"
              value={phoneNumberOnly}
              onChange={(value) => {
                setPhoneNumberOnly(value || "");
                // Combine country code with phone number for storage
                // Don't strip formatting here - let InputMask handle it internally
                const country = getCountryByCode(phoneCountryCode) || getDefaultCountry();
                if (value) {
                  // Only extract digits when we need to store the final value
                  const digitsOnly = value.replace(/\D/g, '');
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
              required
            />
          </div>

          {/* Date of Birth */}
          <div className="mb-6">
            <StyledDateInput
              label="Date of Birth"
              value={formData.date_of_birth || null}
              onChange={(date) => handleInputChange("date_of_birth", date)}
              maxDate={new Date().toISOString().split("T")[0]} // Today's date in YYYY-MM-DD format
              minDate="1900-01-01"
              required
            />
          </div>

          {/* Nationality */}
          <div className="mb-6">
            <GlassmorphismDropdown
              label="Nationality"
              value={formData.nationality ?? ""}
              options={NATIONALITY_OPTIONS}
              onChange={(value) => handleInputChange("nationality", value as string)}
              placeholder="Select nationality"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleSave}
              disabled={!isFormValid || isSaving}
              className="px-8 py-3 text-base font-medium"
              variant="primary"
            >
              {isSaving ? "Saving..." : "Save & Continue"}
            </Button>
          </div>

        </StepContainer>
      </StepWrapper>
    </div>
  );
}
