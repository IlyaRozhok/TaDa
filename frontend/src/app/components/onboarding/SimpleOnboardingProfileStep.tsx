"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import { useTranslation } from "../../hooks/useTranslation";
import { wizardKeys } from "../../lib/translationsKeys/wizardTranslationKeys";
import { profileKeys } from "../../lib/translationsKeys/profileTranslationKeys";
import { StepWrapper } from "../preferences/step-components/StepWrapper";
import { StepContainer } from "../preferences/step-components/StepContainer";
import { InputField } from "../preferences/ui/InputField";
import { StyledDateInput } from "../../../shared/ui/DateInput/StyledDateInput";
import { PhoneMaskInput, Button } from "../../../shared/ui";
import { useUserProfile } from "../../../shared/hooks/useUserProfile";
import CountryDropdown from "@/shared/ui/CountryDropdown/CountryDropdown";

interface SimpleOnboardingProfileStepProps {
  onComplete: () => void;
  isLoading?: boolean;
  onNext?: () => void;
  currentStep?: number;
  totalSteps?: number;
  onValidationChange?: (isValid: boolean) => void;
  onSave?: () => Promise<boolean>;
}

export default function SimpleOnboardingProfileStep({
  onComplete,
  isLoading: externalLoading,
  onNext,
  currentStep = 1,
  totalSteps = 1,
  onValidationChange,
  onSave,
}: SimpleOnboardingProfileStepProps) {
  const { t } = useTranslation();
  const user = useSelector(selectUser);

  const {
    formData,
    phoneCountryCode,
    phoneNumberOnly,
    hasChanges,
    isSaving,
    isLoading,
    dateOfBirthError,
    handleInputChange,
    handlePhoneChange,
    validateForm,
    saveProfile,
  } = useUserProfile(user, {
    onSuccess: onComplete,
    onError: (error) => console.error("Profile update error:", error),
  });

  // Notify parent about validation state
  useEffect(() => {
    const isValid = validateForm();
    onValidationChange?.(isValid);
  }, [formData, validateForm, onValidationChange]);

  const handleSave = async (): Promise<boolean> => {
    if (onSave) {
      return await onSave();
    }
    return await saveProfile();
  };

  const handleNext = async () => {
    const success = await handleSave();
    if (success && onNext) {
      onNext();
    }
  };

  const loading = externalLoading || isLoading || isSaving;

  return (
    <StepWrapper>
      <StepContainer
        title={t(wizardKeys.profileStepTitle)}
        subtitle={t(wizardKeys.profileStepSubtitle)}
        currentStep={currentStep}
        totalSteps={totalSteps}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={t(profileKeys.firstName)}
              value={formData.first_name || ""}
              onChange={(value) => handleInputChange("first_name", value)}
              placeholder={t(profileKeys.firstNamePlaceholder)}
              required
              disabled={loading}
            />

            <InputField
              label={t(profileKeys.lastName)}
              value={formData.last_name || ""}
              onChange={(value) => handleInputChange("last_name", value)}
              placeholder={t(profileKeys.lastNamePlaceholder)}
              required
              disabled={loading}
            />
          </div>

          <InputField
            label={t(profileKeys.address)}
            value={formData.address || ""}
            onChange={(value) => handleInputChange("address", value)}
            placeholder={t(profileKeys.addressPlaceholder)}
            disabled={loading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t(profileKeys.phone)}
              </label>
              <PhoneMaskInput
                value={phoneNumberOnly}
                countryCode={phoneCountryCode}
                onChange={handlePhoneChange}
                placeholder={t(profileKeys.phonePlaceholder)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t(profileKeys.dateOfBirth)} *
              </label>
              <StyledDateInput
                value={formData.date_of_birth || ""}
                onChange={(value) => handleInputChange("date_of_birth", value)}
                placeholder={t(profileKeys.dateOfBirthPlaceholder)}
                error={dateOfBirthError}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t(profileKeys.nationality)}
            </label>
            <CountryDropdown
              value={formData.nationality || ""}
              onChange={(value) => handleInputChange("nationality", value)}
              placeholder={t(profileKeys.nationalityPlaceholder)}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end pt-6">
            <Button
              onClick={handleNext}
              disabled={!validateForm() || loading}
              loading={loading}
              size="lg"
            >
              {onNext ? t(wizardKeys.next) : t(wizardKeys.complete)}
            </Button>
          </div>
        </div>
      </StepContainer>
    </StepWrapper>
  );
}