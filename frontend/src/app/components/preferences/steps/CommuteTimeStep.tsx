import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { DateInput } from "@/shared/ui/DateInput";
import { InputField } from "../ui/InputField";
import { PreferencesFormData } from "@/app/types/preferences";

interface CommuteTimeStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
}

export const CommuteTimeStep: React.FC<CommuteTimeStepProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <StepWrapper
      title="Step 3"
      description="Step 2"
    >
      <StepContainer>
        {/* Move-in Date */}
        <StepHeader title="Move-in Date" />
        <div className="space-y-6 mb-8">
          <DateInput
            label="Move in date from"
            name="move_in_date"
            value={formData.move_in_date || null}
            onChange={(date) => onUpdate("move_in_date", date)}
            minDate={new Date().toISOString().split("T")[0]}
          />
          <DateInput
            label="Move in date to"
            name="move_out_date"
            value={formData.move_out_date || null}
            onChange={(date) => onUpdate("move_out_date", date)}
            minDate={formData.move_in_date || new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Budget */}
        <StepHeader title="Budget" />
        <div className="space-y-4 mb-8">
          <InputField
            label="Price from"
            value={formData.min_price || ""}
            onChange={(e) => onUpdate("min_price", e.target.value ? parseInt(e.target.value) : 0)}
            type="number"
            min={0}
          />
          <InputField
            label="Price to"
            value={formData.max_price || ""}
            onChange={(e) => onUpdate("max_price", e.target.value ? parseInt(e.target.value) : 0)}
            type="number"
            min={0}
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
