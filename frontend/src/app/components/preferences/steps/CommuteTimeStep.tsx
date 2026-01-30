import React, { useState, useCallback } from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { DateInput } from "@/shared/ui/DateInput";
import { InputField } from "../ui/InputField";
import { SelectionButton } from "../step-components/SelectionButton";
import { PreferencesFormData } from "@/app/types/preferences";
import { useTranslation } from "../../../hooks/useTranslation";
import { wizardKeys } from "../../../lib/translationsKeys/wizardTranslationKeys";

interface CommuteTimeStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
}

export const CommuteTimeStep: React.FC<CommuteTimeStepProps> = ({
  formData,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const [moveInDateError, setMoveInDateError] = useState<string | undefined>();

  const FLEXIBILITY_OPTIONS = ["flexible"];

  // Validate move-in date format and value
  const validateMoveInDate = useCallback(
    (date: string | null): string | undefined => {
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
    },
    [],
  );

  const handleMoveInDateChange = useCallback(
    (date: string | null) => {
      // Always update the value so user can see what they typed
      onUpdate("move_in_date", date);

      // Validate and set error
      const error = validateMoveInDate(date);
      setMoveInDateError(error);
    },
    [validateMoveInDate, onUpdate],
  );

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
      title={t(wizardKeys.step2.title)}
      description={t(wizardKeys.step2.subtitle)}
    >
      <StepContainer>
        {/* Move-in Date */}
        <StepHeader title={t(wizardKeys.step2.des.text1)} />
        <div className="space-y-6 mb-6">
          <div>
            <DateInput
              label={t(wizardKeys.step2.move.from.title)}
              name="move_in_date"
              value={formData.move_in_date || null}
              onChange={handleMoveInDateChange}
              onBlur={handleMoveInDateBlur}
              error={moveInDateError}
              minDate={new Date().toISOString().split("T")[0]}
              placeholder={t(wizardKeys.profile.birth.text)}
            />
          </div>
          <DateInput
            label={t(wizardKeys.step2.move.to.title)}
            name="move_out_date"
            value={formData.move_out_date || null}
            onChange={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const moveInDate = formData.move_in_date
                ? new Date(formData.move_in_date)
                : today;
              moveInDate.setHours(0, 0, 0, 0);
              const selectedDate = date ? new Date(date) : null;
              const minDate = moveInDate > today ? moveInDate : today;
              if (selectedDate && selectedDate < minDate) return;
              onUpdate("move_out_date", date);
            }}
            minDate={
              formData.move_in_date || new Date().toISOString().split("T")[0]
            }
          />
        </div>

        {/* Budget */}
        <StepHeader title={t(wizardKeys.step2.des.text2)} />
        <div className="space-y-4 mb-6">
          <InputField
            label={t(wizardKeys.step2.budget.from)}
            value={formData.min_price ?? ""}
            onChange={(e) =>
              onUpdate(
                "min_price",
                e.target.value && e.target.value.trim() !== ""
                  ? parseInt(e.target.value)
                  : undefined,
              )
            }
            type="number"
            min={0}
          />
          <InputField
            label={t(wizardKeys.step2.budget.to)}
            value={formData.max_price ?? ""}
            onChange={(e) =>
              onUpdate(
                "max_price",
                e.target.value && e.target.value.trim() !== ""
                  ? parseInt(e.target.value)
                  : undefined,
              )
            }
            type="number"
            min={0}
          />
          <StepHeader title={t(wizardKeys.step2.budget.flexibleBudget)} />
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="flexible_budget"
              checked={formData.flexible_budget ?? false}
              onChange={(e) => onUpdate("flexible_budget", e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="flexible_budget"
              className="text-sm font-medium text-black cursor-pointer"
            >
              {t(wizardKeys.step2.budget.flexibleBudget)}
            </label>
          </div>
          <StepHeader title={t(wizardKeys.step2.budget.flexible)} />
          <div className="space-y-4">
            {FLEXIBILITY_OPTIONS.map((option) => (
              <SelectionButton
                key={option}
                label={t(wizardKeys.step2.budget.flexible)}
                value={option}
                isSelected={formData.move_in_flexibility === option}
                onClick={() =>
                  onUpdate(
                    "move_in_flexibility",
                    formData.move_in_flexibility === option ? "" : option,
                  )
                }
              />
            ))}
          </div>
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
