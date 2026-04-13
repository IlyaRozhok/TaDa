"use client";

import React, { useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import { useTranslation } from "../../hooks/useTranslation";
import { wizardKeys } from "../../lib/translationsKeys/wizardTranslationKeys";
import { onboardingKeys } from "../../lib/translationsKeys/onboardingTranslationKeys";
import { StepWrapper } from "../preferences/step-components/StepWrapper";
import { StepContainer } from "../preferences/step-components/StepContainer";
import { Button } from "../../../shared/ui";
import { useUnifiedProfile } from "../../../shared/hooks/useUnifiedProfile";
import { ProfileFormFields } from "../../../shared/components/ProfileFormFields";

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
    validateDateOfBirth,
    validateForm,
    saveProfile,
  } = useUnifiedProfile(user, {
    onSuccess: onComplete,
    onError: (error) => console.error("Profile update error:", error),
  });

  // Notify parent about validation state
  useEffect(() => {
    const isValid = validateForm();
    onValidationChange?.(isValid);
  }, [formData, validateForm, onValidationChange]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (onSave) {
      return await onSave();
    }
    return await saveProfile();
  }, [onSave, saveProfile]);

  // Keep onboarding save contract aligned with parent onboarding page logic.
  useEffect(() => {
    (window as any).onboardingProfileSave = handleSave;
    return () => {
      delete (window as any).onboardingProfileSave;
    };
  }, [handleSave]);

  const handleNext = async () => {
    const success = await handleSave();
    if (success && onNext) {
      onNext();
    }
  };

  const loading = externalLoading || isLoading || isSaving;

  // Simple date change handler
  const handleDateChangeCallback = useCallback((date: string | null) => {
    handleInputChange("date_of_birth", date || "");
  }, [handleInputChange]);

  return (
    <StepWrapper
      title={t(wizardKeys.profile.title)}
      description={t(wizardKeys.profile.subtitle)}
    >
      <StepContainer>
        <div className="space-y-6">
          <ProfileFormFields
            formData={formData}
            phoneCountryCode={phoneCountryCode}
            phoneNumberOnly={phoneNumberOnly}
            dateOfBirthError={dateOfBirthError}
            onInputChange={handleInputChange}
            onPhoneChange={handlePhoneChange}
            onDateChange={handleDateChangeCallback}
          />

          <div className="flex justify-end pt-6">
            <Button
              onClick={handleNext}
              disabled={!validateForm() || loading}
              size="lg"
            >
              {onNext ? t(onboardingKeys.bottom.nextButton) : t(onboardingKeys.bottom.doneButton)}
            </Button>
          </div>
        </div>
      </StepContainer>
    </StepWrapper>
  );
}