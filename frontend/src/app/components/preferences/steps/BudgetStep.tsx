import React, { useRef, useEffect, useCallback } from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { InputField } from "../ui/InputField";
import { PreferencesFormData } from "@/app/types/preferences";

interface BudgetStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
  onToggle: (category: keyof PreferencesFormData, value: string) => void;
}

// Property type options matching the screenshot
const PROPERTY_TYPES = [
  "Flat",
  "Apartment",
  "House",
  "Room",
  "Studio",
  "Penthouse",
];

// Room options
const ROOM_OPTIONS = ["1", "2", "3", "4", "5+"];

// Bathroom options
const BATHROOM_OPTIONS = ["1", "2", "3", "4+"];

// Furnishing options - using same values as in database
const FURNISHING_OPTIONS = [
  { value: "furnished", label: "Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "partially_furnished", label: "Part-furnished" },
];

// Outdoor space options (multi-select)
const OUTDOOR_SPACE_OPTIONS = ["Balcony", "Teracce", "Outdoor Space"];

export const BudgetStep: React.FC<BudgetStepProps> = ({
  formData,
  onUpdate,
  onToggle,
}) => {
  const rangeRef = useRef<HTMLDivElement>(null);
  const minSliderRef = useRef<HTMLInputElement>(null);
  const maxSliderRef = useRef<HTMLInputElement>(null);
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);

  const MIN_VALUE = 15;
  const MAX_VALUE = 500;

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
    []
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
  useEffect(() => {
    const minValue = formData.min_square_meters ?? 15;
    const maxValue = formData.max_square_meters ?? 45;
    const minPercent = valueToPercentage(minValue);
    const maxPercent = valueToPercentage(maxValue);

    setThumbPosition("min", minPercent);
    setThumbPosition("max", maxPercent);
  }, [
    formData.min_square_meters,
    formData.max_square_meters,
    valueToPercentage,
    setThumbPosition,
  ]);

  // Handle min input change
  const handleMinInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^0-9]/g, "");

      if (inputValue === "") {
        // Allow empty input temporarily
        return;
      }

      const maxValue = formData.max_square_meters ?? MAX_VALUE;
      let value = parseInt(inputValue) || MIN_VALUE;

      // Validate range
      if (value < MIN_VALUE) value = MIN_VALUE;
      if (value > MAX_VALUE) value = MAX_VALUE;
      if (value >= maxValue) value = maxValue - 1;

      const percentage = valueToPercentage(value);
      if (minSliderRef.current) {
        minSliderRef.current.value = percentage.toString();
      }
      setThumbPosition("min", percentage);
      onUpdate("min_square_meters", value);
    },
    [formData.max_square_meters, valueToPercentage, setThumbPosition, onUpdate]
  );

  // Handle min input blur - validate on blur
  const handleMinInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      let value = parseInt(e.target.value) || MIN_VALUE;
      const maxValue = formData.max_square_meters ?? MAX_VALUE;

      if (value < MIN_VALUE) value = MIN_VALUE;
      if (value > MAX_VALUE) value = MAX_VALUE;
      if (value >= maxValue) value = maxValue - 1;

      onUpdate("min_square_meters", value);
    },
    [formData.max_square_meters, onUpdate]
  );

  // Handle max input change
  const handleMaxInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^0-9]/g, "");

      if (inputValue === "") {
        // Allow empty input temporarily
        return;
      }

      const minValue = formData.min_square_meters ?? MIN_VALUE;
      let value = parseInt(inputValue) || MAX_VALUE;

      // Validate range
      if (value < minValue + 1) value = minValue + 1;
      if (value > MAX_VALUE) value = MAX_VALUE;

      const percentage = valueToPercentage(value);
      if (maxSliderRef.current) {
        maxSliderRef.current.value = percentage.toString();
      }
      setThumbPosition("max", percentage);
      onUpdate("max_square_meters", value);
    },
    [formData.min_square_meters, valueToPercentage, setThumbPosition, onUpdate]
  );

  // Handle max input blur - validate on blur
  const handleMaxInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      let value = parseInt(e.target.value) || MAX_VALUE;
      const minValue = formData.min_square_meters ?? MIN_VALUE;

      if (value < minValue + 1) value = minValue + 1;
      if (value > MAX_VALUE) value = MAX_VALUE;

      onUpdate("max_square_meters", value);
    },
    [formData.min_square_meters, onUpdate]
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
    [getThumbPosition, percentageToValue, setThumbPosition, onUpdate]
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
    [getThumbPosition, percentageToValue, setThumbPosition, onUpdate]
  );

  return (
    <StepWrapper title="Step 3" description="Step 3">
      <StepContainer>
        {/* Property Type - Multi Select */}
        <StepHeader title="Select property type" />
        <div className="space-y-4 mb-8">
          {PROPERTY_TYPES.map((type) => (
            <SelectionButton
              key={type}
              label={type}
              value={type}
              isSelected={
                formData.property_type_preferences?.includes(type) || false
              }
              onClick={() => onToggle("property_type_preferences", type)}
            />
          ))}
        </div>

        {/* Rooms - Multi Select */}
        <StepHeader title="Rooms" />
        <div className="space-y-4 mb-8">
          {ROOM_OPTIONS.map((room) => (
            <SelectionButton
              key={room}
              label={room}
              value={room}
              isSelected={formData.rooms_preferences?.includes(room) || false}
              onClick={() => onToggle("rooms_preferences", room)}
            />
          ))}
        </div>

        {/* Bathrooms - Multi Select */}
        <StepHeader title="Bathrooms" />
        <div className="space-y-4 mb-8">
          {BATHROOM_OPTIONS.map((bath) => (
            <SelectionButton
              key={bath}
              label={bath}
              value={bath}
              isSelected={
                formData.bathrooms_preferences?.includes(bath) || false
              }
              onClick={() => onToggle("bathrooms_preferences", bath)}
            />
          ))}
        </div>

        {/* Furnishing - Multi Select */}
        <StepHeader title="Furnishing" />
        <div className="space-y-4 mb-8">
          {FURNISHING_OPTIONS.map((option) => (
            <SelectionButton
              key={option.value}
              label={option.label}
              value={option.value}
              isSelected={
                formData.furnishing_preferences?.includes(option.value) || false
              }
              onClick={() => onToggle("furnishing_preferences", option.value)}
            />
          ))}
        </div>

        {/* Outdoor Space - Multi Select */}
        <StepHeader title="Outdoor space" />
        <div className="space-y-4 mb-8">
          {OUTDOOR_SPACE_OPTIONS.map((option) => (
            <SelectionButton
              key={option}
              label={option}
              value={option}
              isSelected={
                formData.outdoor_space_preferences?.includes(option) || false
              }
              onClick={() => onToggle("outdoor_space_preferences", option)}
            />
          ))}
        </div>

        {/* Meters - Range Input with Dual Slider */}
        <StepHeader title="Meters" />
        <div className="space-y-4">
          {/* Input fields */}
          <div className="flex gap-4">
            <div className="flex-1">
              <InputField
                ref={minInputRef}
                label=""
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.min_square_meters?.toString() ?? "15"}
                onChange={handleMinInputChange}
                onBlur={handleMinInputBlur}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                placeholder="15"
              />
            </div>
            <div className="flex-1">
              <InputField
                ref={maxInputRef}
                label=""
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.max_square_meters?.toString() ?? "45"}
                onChange={handleMaxInputChange}
                onBlur={handleMaxInputBlur}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                placeholder="500"
              />
            </div>
          </div>

          {/* Range slider */}
          <div className="px-2">
            <div
              ref={rangeRef}
              className="relative"
              style={
                {
                  "--range-track-top": "10px",
                  "--min-thumb-percent": valueToPercentage(
                    formData.min_square_meters ?? 15
                  ),
                  "--max-thumb-percent": valueToPercentage(
                    formData.max_square_meters ?? 45
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
                  value={valueToPercentage(formData.min_square_meters ?? 15)}
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
                  value={valueToPercentage(formData.max_square_meters ?? 45)}
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
