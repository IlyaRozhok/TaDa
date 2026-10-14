"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import { useTranslation } from "../../hooks/useTranslation";
import { wizardKeys } from "../../lib/translationsKeys/wizardTranslationKeys";
import { StepWrapper } from "../preferences/step-components/StepWrapper";
import { StepContainer } from "../preferences/step-components/StepContainer";
import { useUnifiedProfile } from "../../../shared/hooks/useUnifiedProfile";
import { ProfileFormFields } from "../../../shared/components/ProfileFormFields";

interface SimpleOnboardingProfileStepProps {
  onComplete: () => void;
  currentStep?: number;
  totalSteps?: number;
  onValidationChange?: (isValid: boolean) => void;
  onSave?: () => Promise<boolean>;
}

export default function SimpleOnboardingProfileStep({
  onComplete,
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
    verifiedPhone,
    hasChanges,
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

  // Simple date change handler
  const handleDateChangeCallback = useCallback((date: string | null) => {
    handleInputChange("date_of_birth", date || "");
  }, [handleInputChange]);

  // The phone verification's Send code / Confirm button renders here, at the
  // bottom of the form, while its phone row and code box swap in place above.
  // The step has no Next of its own: the wizard footer's Next saves through
  // window.onboardingProfileSave.
  const [phoneActionSlot, setPhoneActionSlot] = useState<HTMLDivElement | null>(null);

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
            verifiedPhone={verifiedPhone}
            dateOfBirthError={dateOfBirthError}
            onInputChange={handleInputChange}
            onPhoneChange={handlePhoneChange}
            onDateChange={handleDateChangeCallback}
            phoneActionContainer={phoneActionSlot}
          />

          <div ref={setPhoneActionSlot} className="empty:hidden" />
        </div>
      </StepContainer>
    </StepWrapper>
  );
}