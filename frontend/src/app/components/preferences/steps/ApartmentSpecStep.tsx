import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { PreferencesFormData } from "@/app/types/preferences";

interface ApartmentSpecStepProps {
  formData: PreferencesFormData;
  onToggle: (category: keyof PreferencesFormData, value: string) => void;
}

// Tenant type options
const TENANT_TYPE_OPTIONS = ["Corporate Lets", "Sharers", "Student", "Family", "Elder"];

export const ApartmentSpecStep: React.FC<ApartmentSpecStepProps> = ({
  formData,
  onToggle,
}) => {
  return (
    <StepWrapper
      title="Step 5"
      description="Step 5"
    >
      <StepContainer>
        {/* Tenant Type - Multi Select */}
        <StepHeader title="Tenant Type" />
        <div className="space-y-4">
          {TENANT_TYPE_OPTIONS.map((type) => (
            <SelectionButton
              key={type}
              label={type}
              value={type}
              isSelected={formData.tenant_type_preferences?.includes(type) || false}
              onClick={() => onToggle("tenant_type_preferences", type)}
            />
          ))}
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
