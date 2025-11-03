import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { PROPERTY_TYPE_OPTIONS } from "@/app/constants/preferences";

interface PropertyTypeStepProps {
  formData: any;
  onToggle: (category: string, value: string) => void;
}

export const PropertyTypeStep: React.FC<PropertyTypeStepProps> = ({
  formData,
  onToggle,
}) => {
  return (
    <StepWrapper
      title="Property type"
      description="Select all property types you're interested in"
    >
      <StepContainer>
        <StepHeader title="Select property types" />

        <div className="space-y-4">
          {PROPERTY_TYPE_OPTIONS.map((type) => (
            <SelectionButton
              key={type}
              label={type}
              value={type}
              isSelected={formData.property_type?.includes(type) || false}
              onClick={(value) => onToggle("property_type", value)}
            />
          ))}
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
