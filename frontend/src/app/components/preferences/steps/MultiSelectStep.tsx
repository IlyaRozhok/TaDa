import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";

interface MultiSelectStepProps {
  title: string;
  description: string;
  stepTitle: string;
  stepSubtitle?: string;
  options: Array<{
    value: string;
    label: string;
    icon?: React.ComponentType<any>;
  }>;
  formData: any;
  onToggle: (category: string, value: string) => void;
  category: string;
  className?: string;
}

export const MultiSelectStep: React.FC<MultiSelectStepProps> = ({
  title,
  description,
  stepTitle,
  stepSubtitle,
  options,
  formData,
  onToggle,
  category,
  className = "",
}) => {
  return (
    <StepWrapper title={title} description={description} className={className}>
      <StepContainer>
        <StepHeader title={stepTitle} subtitle={stepSubtitle} />

        <div className="space-y-4">
          {options.map((option) => (
            <SelectionButton
              key={option.value}
              label={option.label}
              value={option.value}
              icon={option.icon}
              isSelected={formData[category]?.includes(option.value) || false}
              onClick={(value) => onToggle(category, value)}
            />
          ))}
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
