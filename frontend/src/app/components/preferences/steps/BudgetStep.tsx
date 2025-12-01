import React, { useRef, useState, useEffect } from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { InputField } from "../ui/InputField";

interface BudgetStepProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  onToggle: (category: string, value: string) => void;
}

// Property type options matching the screenshot
const PROPERTY_TYPES = ["Flat", "Apartment", "House", "Room", "Studio", "Penthouse"];

// Room options
const ROOM_OPTIONS = ["1", "2", "3", "4", "5+"];

// Bathroom options
const BATHROOM_OPTIONS = ["1", "2", "3", "4+"];

// Furnishing options
const FURNISHING_OPTIONS = ["Furnishing", "Furnished", "Part-furnished"];

// Outdoor space options (multi-select)
const OUTDOOR_SPACE_OPTIONS = ["Balcony", "Teracce", "Outdoor Space"];

export const BudgetStep: React.FC<BudgetStepProps> = ({
  formData,
  onUpdate,
  onToggle,
}) => {
  const [activeSlider, setActiveSlider] = useState<'min' | 'max' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const minSliderRef = useRef<HTMLInputElement>(null);
  const maxSliderRef = useRef<HTMLInputElement>(null);

  // Reset active slider when mouse is released
  useEffect(() => {
    const handleMouseUp = () => {
      setActiveSlider(null);
    };
    const handleTouchEnd = () => {
      setActiveSlider(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <StepWrapper
      title="Step 3"
      description="Step 3"
    >
      <StepContainer>
        {/* Property Type - Multi Select */}
        <StepHeader title="Select property type" />
        <div className="space-y-4 mb-8">
          {PROPERTY_TYPES.map((type) => (
            <SelectionButton
              key={type}
              label={type}
              value={type}
              isSelected={formData.property_type_preferences?.includes(type) || false}
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
              isSelected={formData.bathrooms_preferences?.includes(bath) || false}
              onClick={() => onToggle("bathrooms_preferences", bath)}
            />
          ))}
        </div>

        {/* Furnishing - Multi Select */}
        <StepHeader title="Furnishing" />
        <div className="space-y-4 mb-8">
          {FURNISHING_OPTIONS.map((option) => (
            <SelectionButton
              key={option}
              label={option}
              value={option}
              isSelected={formData.furnishing_preferences?.includes(option) || false}
              onClick={() => onToggle("furnishing_preferences", option)}
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
              isSelected={formData.outdoor_space_preferences?.includes(option) || false}
              onClick={() => onToggle("outdoor_space_preferences", option)}
            />
          ))}
        </div>

        {/* Meters - Range Input with Dual Slider */}
        <StepHeader title="Meters" />
        <div className="space-y-4">
          <div className="flex gap-4">
            <InputField
              label=""
              value={formData.min_square_meters ?? 15}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : 15;
                onUpdate("min_square_meters", Math.min(val, formData.max_square_meters || 500));
              }}
              type="number"
              min={15}
              max={500}
            />
            <InputField
              label=""
              value={formData.max_square_meters ?? 45}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : 500;
                onUpdate("max_square_meters", Math.max(val, formData.min_square_meters || 15));
              }}
              type="number"
              min={15}
              max={500}
            />
          </div>
          <div className="px-2">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>от {formData.min_square_meters ?? 15}</span>
              <span>до 500</span>
            </div>
            <div 
              ref={containerRef}
              className="relative h-2 bg-gray-200 rounded-full"
            >
              {/* Track fill between two thumbs */}
              <div 
                className="absolute h-2 bg-black rounded-full pointer-events-none"
                style={{
                  left: `${((formData.min_square_meters ?? 15) - 15) / (500 - 15) * 100}%`,
                  right: `${100 - ((formData.max_square_meters ?? 45) - 15) / (500 - 15) * 100}%`
                }}
              />
              {/* Min slider - positioned first, only thumb is interactive */}
              <input
                ref={minSliderRef}
                type="range"
                min={15}
                max={formData.max_square_meters ?? 500}
                value={formData.min_square_meters ?? 15}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val <= (formData.max_square_meters ?? 500)) {
                    onUpdate("min_square_meters", val);
                  }
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setActiveSlider('min');
                  // Temporarily raise z-index to ensure this slider captures events
                  if (minSliderRef.current) {
                    minSliderRef.current.style.zIndex = '10';
                    minSliderRef.current.focus();
                  }
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setActiveSlider('min');
                  if (minSliderRef.current) {
                    minSliderRef.current.style.zIndex = '10';
                    minSliderRef.current.focus();
                  }
                }}
                onMouseUp={() => {
                  if (minSliderRef.current) {
                    minSliderRef.current.style.zIndex = '1';
                  }
                }}
                onTouchEnd={() => {
                  if (minSliderRef.current) {
                    minSliderRef.current.style.zIndex = '1';
                  }
                }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '8px',
                  zIndex: 1,
                }}
                className="appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-[200] [&::-webkit-slider-track]:pointer-events-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-black [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-track]:pointer-events-none"
              />
              {/* Max slider - positioned second, only thumb is interactive */}
              <input
                ref={maxSliderRef}
                type="range"
                min={formData.min_square_meters ?? 15}
                max={500}
                value={formData.max_square_meters ?? 45}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= (formData.min_square_meters ?? 15)) {
                    onUpdate("max_square_meters", val);
                  }
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setActiveSlider('max');
                  // Temporarily raise z-index to ensure this slider captures events
                  if (maxSliderRef.current) {
                    maxSliderRef.current.style.zIndex = '10';
                    maxSliderRef.current.focus();
                  }
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setActiveSlider('max');
                  if (maxSliderRef.current) {
                    maxSliderRef.current.style.zIndex = '10';
                    maxSliderRef.current.focus();
                  }
                }}
                onMouseUp={() => {
                  if (maxSliderRef.current) {
                    maxSliderRef.current.style.zIndex = '2';
                  }
                }}
                onTouchEnd={() => {
                  if (maxSliderRef.current) {
                    maxSliderRef.current.style.zIndex = '2';
                  }
                }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '8px',
                  zIndex: 2,
                }}
                className="appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-[200] [&::-webkit-slider-track]:pointer-events-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-black [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-track]:pointer-events-none"
              />
            </div>
          </div>
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
