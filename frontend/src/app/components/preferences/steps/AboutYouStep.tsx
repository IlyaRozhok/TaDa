import React, { useEffect } from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { TextAreaField } from "../step-components/TextAreaField";
import { PreferencesFormData } from "@/app/types/preferences";

interface AboutYouStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
  onValidationChange?: (isValid: boolean) => void;
}


export const AboutYouStep: React.FC<AboutYouStepProps> = ({
  formData,
  onUpdate,
  onValidationChange,
}) => {
  // Validation logic - all fields are optional, so always valid
  const isValid = (): boolean => {
    // Since most preferences are optional, the step is always valid
    // Users can complete onboarding without filling all fields
    return true;
  };

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid());
    }
  }, [
    formData.additional_info,
    onValidationChange,
    isValid,
  ]);
  return (
    <StepWrapper title="Step 11" description="Step 11">
      <StepContainer>
        <div className="space-y-6">
          {/* About You */}
          <TextAreaField
            label="Tell about yourself (optional)"
            value={formData.additional_info || ""}
            onChange={(value) => onUpdate("additional_info", value)}
            placeholder="e.g., I'm a quiet professional who enjoys cooking and reading. I keep a clean living space and am always respectful of neighbors. I'm looking for a peaceful home environment where I can relax after work..."
            rows={8}
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
