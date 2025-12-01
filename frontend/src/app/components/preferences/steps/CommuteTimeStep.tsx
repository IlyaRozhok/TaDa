import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { DateRangePicker } from "../ui/DateRangePicker";
import { InputField } from "../ui/InputField";

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
      title="Step 2"
      description="Step 2"
    >
      <StepContainer>
        {/* Move-in Date */}
        <StepHeader title="Move-in Date" />
        <div className="space-y-6 mb-8">
          <DateRangePicker
            label="Move-in Date"
            value={{
              start: formData.move_in_date || null,
              end: formData.move_out_date || null,
            }}
            onChange={(range) => {
              onUpdate("move_in_date", range.start);
              onUpdate(
                "move_out_date",
                range.start === range.end ? null : range.end
              );
            }}
            placeholder="Select date range"
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

        {/* Deposit - Multi-select */}
        <StepHeader title="Deposit" />
        <div className="space-y-4">
          <SelectionButton
            label="Yes"
            value="yes"
            isSelected={formData.deposit_preferences?.includes("yes") || false}
            onClick={() => {
              const current = formData.deposit_preferences || [];
              if (current.includes("yes")) {
                onUpdate("deposit_preferences", current.filter((v: string) => v !== "yes"));
              } else {
                onUpdate("deposit_preferences", [...current, "yes"]);
              }
            }}
          />
          <SelectionButton
            label="No"
            value="no"
            isSelected={formData.deposit_preferences?.includes("no") || false}
            onClick={() => {
              const current = formData.deposit_preferences || [];
              if (current.includes("no")) {
                onUpdate("deposit_preferences", current.filter((v: string) => v !== "no"));
              } else {
                onUpdate("deposit_preferences", [...current, "no"]);
              }
            }}
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
