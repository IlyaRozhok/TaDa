import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { TextAreaField } from "../step-components/TextAreaField";

interface AboutYouStepProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
}

export const AboutYouStep: React.FC<AboutYouStepProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <StepWrapper
      title="About you"
      description="Tell potential landlords and housemates about yourself (optional)"
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
