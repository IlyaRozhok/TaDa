import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { IDEAL_LIVING_OPTIONS, SMOKING_OPTIONS } from "@/app/constants/preferences";

interface LivingEnvironmentStepProps {
  formData: {
    ideal_living_environment?: string[];
    smoker?: string;
    [key: string]: unknown;
  };
  onUpdate: (field: string, value: unknown) => void;
  onToggle: (category: string, value: string) => void;
}

export const LivingEnvironmentStep: React.FC<LivingEnvironmentStepProps> = ({
  formData,
  onToggle,
  onUpdate,
}) => {
  const handleIdealLivingToggle = (value: string) => {
    const current = formData.ideal_living_environment || [];
    const isSelected = current.includes(value);

    if (value === "no-preference") {
      // If "no-preference" is clicked, toggle it and clear all other options
      if (isSelected) {
        // Deselect "no-preference"
        onUpdate("ideal_living_environment", []);
      } else {
        // Select only "no-preference"
        onUpdate("ideal_living_environment", ["no-preference"]);
      }
    } else {
      // If any other option is clicked
      if (isSelected) {
        // Deselect this option
        const updated = current.filter((v) => v !== value);
        onUpdate("ideal_living_environment", updated);
      } else {
        // Select this option and remove "no-preference" if present
        const updated = current.filter((v) => v !== "no-preference");
        updated.push(value);
        onUpdate("ideal_living_environment", updated);
      }
    }
  };

  return (
    <StepWrapper title="Step 9" description="Step 9">
      <StepContainer>
        {/* Ideal Living Environment - Multi Select */}
        <div className="mb-8">
          <StepHeader title="Ideal Living Environment" />
          <div className="space-y-4 mt-4">
            {IDEAL_LIVING_OPTIONS.map((option) => (
              <SelectionButton
                key={option.value}
                label={option.label}
                value={option.value}
                isSelected={
                  formData.ideal_living_environment?.includes(option.value) ||
                  false
                }
                onClick={() => handleIdealLivingToggle(option.value)}
              />
            ))}
          </div>
        </div>

        {/* Do you smoke? - Single Select */}
        <div>
          <StepHeader title="Do you smoke?" />
          <div className="space-y-4 mt-4">
            {SMOKING_OPTIONS.map((option) => (
              <SelectionButton
                key={option.value}
                label={option.label}
                value={option.value}
                isSelected={formData.smoker === option.value}
                onClick={() => {
                  // Single select - if already selected, deselect, otherwise select
                  if (formData.smoker === option.value) {
                    onUpdate("smoker", null);
                  } else {
                    onUpdate("smoker", option.value);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </StepContainer>
    </StepWrapper>
  );
};

