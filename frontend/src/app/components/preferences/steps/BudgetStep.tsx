import React, { useRef, useEffect, useCallback } from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { InputField } from "../ui/InputField";
import { PreferencesFormData } from "@/app/types/preferences";
import { useTranslation } from "../../../hooks/useTranslation";
import { wizardKeys } from "../../../lib/translationsKeys/wizardTranslationKeys";

interface BudgetStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
  onToggle: (category: keyof PreferencesFormData, value: string) => void;
}

// Property type values – must match wizardKeys.step3.propertyTypeOptions order
// (name1=Apartment, name2=Flat, name3=Studio, name4=Penthouse, name5=En-suite room, name6=Room)
// and PROPERTY_TYPE_UI_TO_API in mappings.ts so Studio and others save/load correctly.
const PROPERTY_TYPES = [
  "Apartment",
  "Flat",
  "Studio",
  "Penthouse",
  "En-suite room",
  "Room",
];

// Room values (labels from rooms.count.name1–5)
const ROOM_OPTIONS = ["1", "2", "3", "4", "5+"];

// Bathroom values (labels from bathrooms.count.name1–4)
const BATHROOM_OPTIONS = ["1", "2", "3", "4+"];

// Furnishing options – use UI labels as values so they match form state
// (form loads apiData as transformFurnishingAPIToUI -> "Furnished" | "Unfurnished" | "Part-furnished")
const FURNISHING_OPTIONS = [
  { value: "Furnished" },
  { value: "Unfurnished" },
  { value: "Part-furnished" },
];

// Outdoor space values (labels from outdoorspace.name1–3)
const OUTDOOR_SPACE_OPTIONS = ["Balcony", "Terrace"];

export const BudgetStep: React.FC<BudgetStepProps> = ({
  formData,
  onUpdate,
  onToggle,
}) => {
  const { t } = useTranslation();
  const rangeRef = useRef<HTMLDivElement>(null);
  const minSliderRef = useRef<HTMLInputElement>(null);
  const maxSliderRef = useRef<HTMLInputElement>(null);
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);

  const MIN_VALUE = 15;
  const MAX_VALUE = 500;

  const [minError, setMinError] = React.useState<string | undefined>(undefined);
  const [maxError, setMaxError] = React.useState<string | undefined>(undefined);

  // Convert value to percentage
  const valueToPercentage = useCallback((value: number) => {
    return ((value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * 100;
  }, []);

  // Convert percentage to value
  const percentageToValue = useCallback((percentage: number) => {
    return Math.round((percentage / 100) * (MAX_VALUE - MIN_VALUE) + MIN_VALUE);
  }, []);

  // Set thumb position using CSS variable
  const setThumbPosition = useCallback(
    (thumbType: "min" | "max", percentage: number) => {
      if (!rangeRef.current) return;
      const cssVar =
        thumbType === "min" ? "--min-thumb-percent" : "--max-thumb-percent";
      rangeRef.current.style.setProperty(cssVar, percentage.toString());
    },
    [],
  );

  // Get thumb position from CSS variable
  const getThumbPosition = useCallback((thumbType: "min" | "max"): number => {
    if (!rangeRef.current) return 0;
    const cssVar =
      thumbType === "min" ? "--min-thumb-percent" : "--max-thumb-percent";
    const value = rangeRef.current.style.getPropertyValue(cssVar);
    return parseFloat(value) || 0;
  }, []);

  // Update CSS variables when values change
  // Only update slider if values are actually set (not null/undefined)
  useEffect(() => {
    if (
      formData.min_square_meters !== null &&
      formData.min_square_meters !== undefined
    ) {
      const minValue = formData.min_square_meters;
      const minPercent = valueToPercentage(minValue);
      setThumbPosition("min", minPercent);
      if (minSliderRef.current) {
        minSliderRef.current.value = minPercent.toString();
      }
    }

    if (
      formData.max_square_meters !== null &&
      formData.max_square_meters !== undefined
    ) {
      const maxValue = formData.max_square_meters;
      const maxPercent = valueToPercentage(maxValue);
      setThumbPosition("max", maxPercent);
      if (maxSliderRef.current) {
        maxSliderRef.current.value = maxPercent.toString();
      }
    }
  }, [
    formData.min_square_meters,
    formData.max_square_meters,
    valueToPercentage,
    setThumbPosition,
  ]);

  // Validate max when min changes
  useEffect(() => {
    if (
      formData.min_square_meters !== null &&
      formData.min_square_meters !== undefined &&
      formData.max_square_meters !== null &&
      formData.max_square_meters !== undefined
    ) {
      if (formData.max_square_meters < formData.min_square_meters) {
        setMaxError(
          `Maximum value cannot be less than minimum value (${formData.min_square_meters} meters)`,
        );
      } else {
        setMaxError(undefined);
      }
    } else if (
      formData.max_square_meters === null ||
      formData.max_square_meters === undefined
    ) {
      setMaxError(undefined);
    }
  }, [formData.min_square_meters, formData.max_square_meters]);

  // Handle min input change
  const handleMinInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^0-9]/g, "");

      if (inputValue === "") {
        // Allow empty input temporarily (will be set to null on blur)
        setMinError(undefined);
        onUpdate("min_square_meters", null);
        return;
      }

      const maxValue = formData.max_square_meters ?? MAX_VALUE;
      let value = parseInt(inputValue);

      if (isNaN(value)) {
        setMinError(undefined);
        onUpdate("min_square_meters", null);
        return;
      }

      // Validate range - show error instead of auto-correcting
      if (value < MIN_VALUE) {
        setMinError(`Minimum value cannot be less than ${MIN_VALUE} meters`);
      } else {
        setMinError(undefined);
      }

      if (value > MAX_VALUE) {
        value = MAX_VALUE;
      }

      if (maxValue !== null && value >= maxValue) {
        value = maxValue - 1;
      }

      const percentage = valueToPercentage(value);
      if (minSliderRef.current) {
        minSliderRef.current.value = percentage.toString();
      }
      setThumbPosition("min", percentage);
      onUpdate("min_square_meters", value);
    },
    [formData.max_square_meters, valueToPercentage, setThumbPosition, onUpdate],
  );

  // Handle min input blur - validate on blur
  const handleMinInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.trim();

      // If empty, set to null (no value)
      if (inputValue === "") {
        setMinError(undefined);
        onUpdate("min_square_meters", null);
        return;
      }

      let value = parseInt(inputValue);
      if (isNaN(value)) {
        setMinError(undefined);
        onUpdate("min_square_meters", null);
        return;
      }

      const maxValue = formData.max_square_meters ?? MAX_VALUE;

      // Validate range - show error instead of auto-correcting
      if (value < MIN_VALUE) {
        setMinError(`Minimum value cannot be less than ${MIN_VALUE} meters`);
      } else {
        setMinError(undefined);
      }

      if (value > MAX_VALUE) {
        value = MAX_VALUE;
      }

      if (maxValue !== null && value >= maxValue) {
        value = maxValue - 1;
      }

      onUpdate("min_square_meters", value);
    },
    [formData.max_square_meters, onUpdate],
  );

  // Handle max input change
  const handleMaxInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^0-9]/g, "");

      if (inputValue === "") {
        // Allow empty input temporarily (will be set to null on blur)
        setMaxError(undefined);
        onUpdate("max_square_meters", null);
        return;
      }

      const minValue = formData.min_square_meters;
      let value = parseInt(inputValue);

      if (isNaN(value)) {
        setMaxError(undefined);
        onUpdate("max_square_meters", null);
        return;
      }

      // Validate range - show error instead of auto-correcting
      if (minValue !== null && value < minValue) {
        setMaxError(
          `Maximum value cannot be less than minimum value (${minValue} meters)`,
        );
      } else {
        setMaxError(undefined);
      }

      if (value > MAX_VALUE) {
        value = MAX_VALUE;
      }

      const percentage = valueToPercentage(value);
      if (maxSliderRef.current) {
        maxSliderRef.current.value = percentage.toString();
      }
      setThumbPosition("max", percentage);
      onUpdate("max_square_meters", value);
    },
    [formData.min_square_meters, valueToPercentage, setThumbPosition, onUpdate],
  );

  // Handle max input blur - validate on blur
  const handleMaxInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.trim();

      // If empty, set to null (no value)
      if (inputValue === "") {
        setMaxError(undefined);
        onUpdate("max_square_meters", null);
        return;
      }

      let value = parseInt(inputValue);
      if (isNaN(value)) {
        setMaxError(undefined);
        onUpdate("max_square_meters", null);
        return;
      }

      const minValue = formData.min_square_meters;

      // Validate range - show error instead of auto-correcting
      if (minValue !== null && value < minValue) {
        setMaxError(
          `Maximum value cannot be less than minimum value (${minValue} meters)`,
        );
      } else {
        setMaxError(undefined);
      }

      if (value > MAX_VALUE) {
        value = MAX_VALUE;
      }

      onUpdate("max_square_meters", value);
    },
    [formData.min_square_meters, onUpdate],
  );

  // Handle min range slider change
  const handleMinRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const maxThumbPercent = getThumbPosition("max");
      let percentage = parseFloat(e.target.value);

      if (percentage >= maxThumbPercent) {
        percentage = maxThumbPercent;
        e.target.value = percentage.toString();
      }

      const value = percentageToValue(percentage);
      setThumbPosition("min", percentage);
      onUpdate("min_square_meters", value);
    },
    [getThumbPosition, percentageToValue, setThumbPosition, onUpdate],
  );

  // Handle max range slider change
  const handleMaxRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const minThumbPercent = getThumbPosition("min");
      let percentage = parseFloat(e.target.value);

      if (percentage <= minThumbPercent) {
        percentage = minThumbPercent;
        e.target.value = percentage.toString();
      }

      const value = percentageToValue(percentage);
      setThumbPosition("max", percentage);
      onUpdate("max_square_meters", value);
    },
    [getThumbPosition, percentageToValue, setThumbPosition, onUpdate],
  );

  return (
    <StepWrapper
      title={t(wizardKeys.step3.title)}
      description={t(wizardKeys.step3.subtitle)}
    >
      <StepContainer>
        {/* Property Type - Multi Select */}
        <StepHeader title={t(wizardKeys.step3.sectionPropertyType)} />
        <div className="space-y-4 mb-6">
          {PROPERTY_TYPES.map((type, i) => (
            <SelectionButton
              key={type}
              label={t(wizardKeys.step3.propertyTypeOptions[i])}
              value={type}
              isSelected={
                formData.property_type_preferences?.includes(type) || false
              }
              onClick={() => onToggle("property_type_preferences", type)}
            />
          ))}
        </div>

        {/* Rooms - Multi Select */}
        <StepHeader title={t(wizardKeys.step3.des.text2)} />
        <div className="space-y-4 mb-6">
          {ROOM_OPTIONS.map((room, i) => (
            <SelectionButton
              key={room}
              label={t(wizardKeys.step3.roomsCount[i])}
              value={room}
              isSelected={formData.rooms_preferences?.includes(room) || false}
              onClick={() => onToggle("rooms_preferences", room)}
            />
          ))}
        </div>

        {/* Bathrooms - Multi Select */}
        <StepHeader title={t(wizardKeys.step3.des.text3)} />
        <div className="space-y-4 mb-6">
          {BATHROOM_OPTIONS.map((bath, i) => (
            <SelectionButton
              key={bath}
              label={t(wizardKeys.step3.bathroomsCount[i])}
              value={bath}
              isSelected={
                formData.bathrooms_preferences?.includes(bath) || false
              }
              onClick={() => onToggle("bathrooms_preferences", bath)}
            />
          ))}
        </div>

        {/* Furnishing - Multi Select */}
        <StepHeader title={t(wizardKeys.step3.des.text4)} />
        <div className="space-y-4 mb-6">
          {FURNISHING_OPTIONS.map((option, i) => (
            <SelectionButton
              key={option.value}
              label={t(wizardKeys.step3.furnishingCount[i])}
              value={option.value}
              isSelected={
                formData.furnishing_preferences?.includes(option.value) || false
              }
              onClick={() => onToggle("furnishing_preferences", option.value)}
            />
          ))}
        </div>

        {/* Outdoor Space - Multi Select */}
        <StepHeader title={t(wizardKeys.step3.des.text5)} />
        <div className="space-y-4 mb-6">
          {OUTDOOR_SPACE_OPTIONS.map((option, i) => (
            <SelectionButton
              key={option}
              label={t(wizardKeys.step3.outdoorspace[i])}
              value={option}
              isSelected={
                formData.outdoor_space_preferences?.includes(option) || false
              }
              onClick={() => onToggle("outdoor_space_preferences", option)}
            />
          ))}
        </div>

        {/* Meters - Range Input with Dual Slider */}
        <StepHeader title={t(wizardKeys.step3.des.text6)} />
        <div className="space-y-4">
          {/* Input fields */}
          <div className="flex gap-4">
            <div className="flex-1">
              <InputField
                ref={minInputRef}
                label={t(wizardKeys.step3.meters.min)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.min_square_meters?.toString() ?? ""}
                onChange={handleMinInputChange}
                onBlur={handleMinInputBlur}
                error={minError}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                placeholder=""
              />
            </div>
            <div className="flex-1">
              <InputField
                ref={maxInputRef}
                label={t(wizardKeys.step3.meters.max)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.max_square_meters?.toString() ?? ""}
                onChange={handleMaxInputChange}
                onBlur={handleMaxInputBlur}
                error={maxError}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                placeholder=""
              />
            </div>
          </div>

          {/* Range slider - always show, but values are only saved when user interacts */}
          <div className="px-2">
            <div
              ref={rangeRef}
              className="relative"
              style={
                {
                  "--range-track-top": "10px",
                  "--min-thumb-percent": valueToPercentage(
                    formData.min_square_meters ?? MIN_VALUE,
                  ),
                  "--max-thumb-percent": valueToPercentage(
                    formData.max_square_meters ?? MIN_VALUE,
                  ),
                  "--range-progress-w": `calc((var(--max-thumb-percent) - var(--min-thumb-percent)) * 1%)`,
                  "--range-progress-left": `calc(var(--min-thumb-percent) * 1%)`,
                } as React.CSSProperties
              }
            >
              {/* Track */}
              <div
                className="absolute bg-gray-200 rounded-full pointer-events-none"
                style={{
                  top: "10px",
                  width: "100%",
                  height: "8px",
                }}
              />

              {/* Progress bar */}
              <div
                className="absolute bg-black rounded-full pointer-events-none"
                style={{
                  top: "10px",
                  left: `calc(var(--min-thumb-percent) * 1%)`,
                  width: `calc((var(--max-thumb-percent) - var(--min-thumb-percent)) * 1%)`,
                  height: "8px",
                }}
              />

              {/* Thumbs container with grid */}
              <div className="grid">
                {/* Min slider */}
                <input
                  ref={minSliderRef}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={
                    formData.min_square_meters !== null &&
                    formData.min_square_meters !== undefined
                      ? valueToPercentage(formData.min_square_meters)
                      : valueToPercentage(MIN_VALUE)
                  }
                  onChange={handleMinRangeChange}
                  className="w-full h-[30px] col-start-1 row-start-1 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-track]:pointer-events-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-black [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-track]:pointer-events-none"
                />

                {/* Max slider */}
                <input
                  ref={maxSliderRef}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={
                    formData.max_square_meters !== null &&
                    formData.max_square_meters !== undefined
                      ? valueToPercentage(formData.max_square_meters)
                      : valueToPercentage(MIN_VALUE)
                  }
                  onChange={handleMaxRangeChange}
                  className="w-full h-[30px] col-start-1 row-start-1 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-track]:pointer-events-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-black [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-track]:pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
