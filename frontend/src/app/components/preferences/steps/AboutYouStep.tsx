import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { TextAreaField } from "../step-components/TextAreaField";
import { PreferencesFormData } from "@/app/types/preferences";

interface AboutYouStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
}

export const AboutYouStep: React.FC<AboutYouStepProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <StepWrapper
      title="Step 10"
      description="Step 10"
    >
      <TextAreaField
        label="Tell about yourself"
        value={formData.additional_info || ""}
        onChange={(value) => onUpdate("additional_info", value)}
        placeholder="e.g., I'm a quiet professional who enjoys cooking and reading. I keep a clean living space and am always respectful of neighbors. I'm looking for a peaceful home environment where I can relax after work..."
        rows={8}
      />
    </StepWrapper>
  );
};
