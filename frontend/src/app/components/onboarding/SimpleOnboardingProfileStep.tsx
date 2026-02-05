"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import { useTranslation } from "../../hooks/useTranslation";
import { wizardKeys } from "../../lib/translationsKeys/wizardTranslationKeys";
import { onboardingKeys } from "../../lib/translationsKeys/onboardingTranslationKeys";
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
    <StepWrapper
      title={t(wizardKeys.profile.title)}
      description={t(wizardKeys.profile.subtitle)}
    >
      <StepContainer>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={t(wizardKeys.profile.name)}
              value={formData.first_name || ""}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
              required
              disabled={loading}
            />

            <InputField
              label={t(wizardKeys.profile.lastName)}
              value={formData.last_name || ""}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <InputField
            label={t(wizardKeys.profile.address)}
            value={formData.address || ""}
            onChange={(e) => handleInputChange("address", e.target.value)}
            disabled={loading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <PhoneMaskInput
                value={phoneNumberOnly}
                countryCode={phoneCountryCode}
                onChange={(value) => handlePhoneChange(value || "", phoneCountryCode)}
                onCountryChange={(countryCode) => handlePhoneChange(phoneNumberOnly, countryCode)}
                label={t(wizardKeys.profile.phone)}
                disabled={loading}
              />
            </div>

            <div>
              <StyledDateInput
                value={formData.date_of_birth || ""}
                onChange={(value) => handleInputChange("date_of_birth", value)}
                label={t(wizardKeys.profile.birth.title)}
                placeholder={t(wizardKeys.profile.birth.text)}
                error={dateOfBirthError}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <CountryDropdown
              value={formData.nationality || ""}
              onChange={(value) => handleInputChange("nationality", value)}
              label="Nationality"
              placeholder={t(wizardKeys.profile.nationality)}
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
              {onNext ? t(onboardingKeys.bottom.nextButton) : t(onboardingKeys.bottom.finishButton)}
            </Button>
          </div>
        </div>
      </StepContainer>
    </StepWrapper>
  );
}