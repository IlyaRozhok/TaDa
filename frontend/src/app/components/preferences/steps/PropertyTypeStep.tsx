import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { PreferencesFormData } from "@/app/types/preferences";

interface PropertyTypeStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
  onToggle: (category: keyof PreferencesFormData, value: string) => void;
}

// Building style preferences options
const BUILDING_STYLE_OPTIONS = ["Professional Management", "BTR", "Co-living"];

// Duration options
const DURATION_OPTIONS = ["Any", "Long term 6+ m", "Short term 1+ m"];

// Bills options
const BILLS_OPTIONS = ["Include", "Exclude"];

export const PropertyTypeStep: React.FC<PropertyTypeStepProps> = ({
  formData,
  onUpdate,
  onToggle,
}) => {
  return (
    <StepWrapper
      title="Step 4"
      description="Step 4"
    >
      <StepContainer>
        {/* Building style preferences - Multi Select */}
        <StepHeader title="Building style preferences" />
        <div className="space-y-4 mb-6">
          {BUILDING_STYLE_OPTIONS.map((style) => (
            <SelectionButton
              key={style}
              label={style}
              value={style}
              isSelected={formData.building_style_preferences?.includes(style) || false}
              onClick={() => onToggle("building_style_preferences", style)}
            />
          ))}
        </div>

        {/* Duration - Single Select */}
        <StepHeader title="Duration" />
        <div className="space-y-4 mb-6">
          {DURATION_OPTIONS.map((duration) => (
            <SelectionButton
              key={duration}
              label={duration}
              value={duration}
              isSelected={formData.selected_duration === duration}
              onClick={() => onUpdate("selected_duration", duration)}
            />
          ))}
        </div>

        {/* Bills - Single Select */}
        <StepHeader title="Bills" />
        <div className="space-y-4">
          {BILLS_OPTIONS.map((bill) => (
            <SelectionButton
              key={bill}
              label={bill}
              value={bill}
              isSelected={formData.selected_bills === bill}
              onClick={() => onUpdate("selected_bills", bill)}
            />
          ))}
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
