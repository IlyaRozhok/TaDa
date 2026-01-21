import React, { useState, useCallback } from "react";
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
  const [moveInDateError, setMoveInDateError] = useState<string | undefined>();

  // Validate move-in date format and value
  const validateMoveInDate = useCallback((date: string | null): string | undefined => {
    if (!date || date === "") {
      return undefined; // Empty is allowed
    }

    // Check for invalid format marker from DateInput
    if (date === "INVALID_FORMAT") {
      return "Please enter a valid date in format DD.MM.YYYY";
    }

    // Check if date is in valid format (YYYY-MM-DD)
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormatRegex.test(date)) {
      return "Please enter a valid date in format DD.MM.YYYY";
    }

    // Check if date is valid (not Invalid Date)
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return "Please enter a valid date in format DD.MM.YYYY";
    }

    // Verify the parsed date matches the input (handles cases like 33.33.3333)
    const [year, month, day] = date.split("-");
    if (
      selectedDate.getFullYear() !== parseInt(year) ||
      selectedDate.getMonth() + 1 !== parseInt(month) ||
      selectedDate.getDate() !== parseInt(day)
    ) {
      return "Please enter a valid date in format DD.MM.YYYY";
    }

    // Check if date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return "Move-in date cannot be in the past. Please select today's date or later.";
    }

    return undefined;
  }, []);

  const handleMoveInDateChange = useCallback((date: string | null) => {
    // Always update the value so user can see what they typed
    onUpdate("move_in_date", date);
    
    // Validate and set error
    const error = validateMoveInDate(date);
    setMoveInDateError(error);
  }, [validateMoveInDate, onUpdate]);

  const handleMoveInDateBlur = useCallback(() => {
    // Re-validate on blur to show error if needed
    // Check both the stored value and if user might have entered invalid format
    const currentValue = formData.move_in_date;
    
    if (!currentValue || currentValue === "") {
      // Clear error if field is empty
      setMoveInDateError(undefined);
      return;
    }

    // Validate the current value
    const error = validateMoveInDate(currentValue);
    setMoveInDateError(error);
  }, [formData.move_in_date, validateMoveInDate]);

  return (
    <StepWrapper
      title="Step 2"
      description="Step 2"
    >
      <StepContainer>
        {/* Move-in Date */}
        <StepHeader title="Move-in Date" />
        <div className="space-y-6 mb-6">
          <div>
            <DateInput
              label="Move in date from"
              name="move_in_date"
              value={formData.move_in_date || null}
              onChange={handleMoveInDateChange}
              onBlur={handleMoveInDateBlur}
              error={moveInDateError}
              minDate={new Date().toISOString().split("T")[0]}
            />
          </div>
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
