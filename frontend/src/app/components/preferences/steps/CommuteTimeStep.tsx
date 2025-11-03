import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { InputField } from "../step-components/InputField";

interface CommuteTimeStepProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
}

export const CommuteTimeStep: React.FC<CommuteTimeStepProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <StepWrapper
      title="Maximum Commute Time"
      description="How long are you willing to commute using different transport methods?"
    >
      <StepContainer>
        <StepHeader title="Commute preferences" />

        <div className="space-y-6">
          <InputField
            label="Walking (minutes)"
            value={formData.commute_time_walk || ""}
            onChange={(value) => onUpdate("commute_time_walk", value)}
            type="number"
            min={1}
            max={120}
          />

          <InputField
            label="Cycling (minutes)"
            value={formData.commute_time_cycle || ""}
            onChange={(value) => onUpdate("commute_time_cycle", value)}
            type="number"
            min={1}
            max={120}
          />

          <InputField
            label="Tube/Public Transport (minutes)"
            value={formData.commute_time_tube || ""}
            onChange={(value) => onUpdate("commute_time_tube", value)}
            type="number"
            min={1}
            max={120}
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
