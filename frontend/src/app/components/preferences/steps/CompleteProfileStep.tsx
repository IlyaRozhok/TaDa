import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { HOBBY_OPTIONS } from "@/app/constants/preferences";

interface CompleteProfileStepProps {
  formData: {
    hobbies?: string[];
    [key: string]: unknown;
  };
  onUpdate: (field: string, value: unknown) => void;
  onToggle: (category: string, value: string) => void;
}

export const CompleteProfileStep: React.FC<CompleteProfileStepProps> = ({
  formData,
  onToggle,
}) => {
  return (
    <StepWrapper title="Step 9" description="Step 9">
      <StepContainer>
        {/* Header */}
        <StepHeader title="Hobbies & Interests" />

        {/* Description */}
        <p className="text-base text-black mb-4">
          Select activities you enjoy (helps match you with like-minded
          housemates).
        </p>

        {/* Hobbies Grid - responsive columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {HOBBY_OPTIONS.map((hobby) => (
            <SelectionButton
              key={hobby}
              label={hobby}
              value={hobby}
              isSelected={formData.hobbies?.includes(hobby) || false}
              onClick={() => onToggle("hobbies", hobby)}
            />
          ))}
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
