import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { HOBBY_ICON_OPTIONS } from "@/app/constants/preferences";

interface PersonalPreferencesStepProps {
  formData: any;
  onToggle: (category: string, value: string) => void;
}

export const PersonalPreferencesStep: React.FC<
  PersonalPreferencesStepProps
> = ({ formData, onToggle }) => {
  return (
    <StepWrapper
      title="Personal Preferences"
      description="Tell us about yourself and your living preferences"
    >
      <StepContainer>
        <StepHeader title="Hobbies & Interests" />

        <div className="grid grid-cols-3 gap-4">
          {HOBBY_ICON_OPTIONS.map((hobby) => (
            <SelectionButton
              key={hobby.value}
              label={hobby.label}
              value={hobby.value}
              isSelected={formData.hobbies?.includes(hobby.value) || false}
              onClick={(value) => onToggle("hobbies", value)}
              className="p-4 text-center"
            />
          ))}
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
