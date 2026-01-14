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
      title="Step 2"
      description="Step 2"
    >
      <StepContainer>
        {/* Move-in Date */}
        <StepHeader title="Move-in Date" />
        <div className="space-y-6 mb-6">
          <DateInput
            label="Move in date from"
            name="move_in_date"
            value={formData.move_in_date || null}
            onChange={(date) => {
              // Validate date is not in the past
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const selectedDate = date ? new Date(date) : null;
              
              if (selectedDate && selectedDate < today) {
                // Don't update if date is in the past
                return;
              }
              onUpdate("move_in_date", date);
            }}
            minDate={new Date().toISOString().split("T")[0]}
          />
          <DateInput
            label="Move in date to"
            name="move_out_date"
            value={formData.move_out_date || null}
            onChange={(date) => {
              // Validate date is not before move_in_date or today
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const moveInDate = formData.move_in_date ? new Date(formData.move_in_date) : today;
              moveInDate.setHours(0, 0, 0, 0);
              const selectedDate = date ? new Date(date) : null;
              const minDate = moveInDate > today ? moveInDate : today;
              
              if (selectedDate && selectedDate < minDate) {
                // Don't update if date is before minimum allowed date
                return;
              }
              onUpdate("move_out_date", date);
            }}
            minDate={formData.move_in_date || new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Budget */}
        <StepHeader title="Budget" />
        <div className="space-y-4 mb-6">
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
