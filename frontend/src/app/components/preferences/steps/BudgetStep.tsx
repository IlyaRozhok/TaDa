import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { InputField } from "../step-components/InputField";

interface BudgetStepProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
}

export const BudgetStep: React.FC<BudgetStepProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <StepWrapper
      title="Your Budget"
      description="Select how you'll be using platform. For now one account - one role"
    >
      <div className="space-y-8 text-left">
        <StepContainer>
          <StepHeader title="Budget range" />

          <div className="space-y-6">
            <InputField
              label="Minimum (£/Month)"
              value={formData.min_price || ""}
              onChange={(value) => onUpdate("min_price", value)}
              type="number"
            />

            <InputField
              label="Maximum (£/Month)"
              value={formData.max_price || ""}
              onChange={(value) => onUpdate("max_price", value)}
              type="number"
            />
          </div>
        </StepContainer>
      </div>
    </StepWrapper>
  );
};
