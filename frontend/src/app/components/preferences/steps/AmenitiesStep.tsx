import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { PreferencesFormData } from "@/app/types/preferences";

interface AmenitiesStepProps {
  formData: PreferencesFormData;
  onToggle: (category: keyof PreferencesFormData, value: string) => void;
}

// Amenities from admin panel buildings
const AMENITIES_OPTIONS = [
  "Gym",
  "Co-working",
  "Meeting rooms",
  "Lounge",
  "Cinema",
  "Roof terrace",
  "Courtyard",
  "Parking",
  "Bike storage",
  "Parcel room",
  "Maintenance",
  "Events calendar",
  "Pet areas",
  "Kids' room",
  "Garden",
  // Additional lifestyle amenities from screenshot
  "Reading",
  "Music",
  "Art",
  "Hiking",
  "Cooking",
  "Travel",
  "Sport",
  "Yoga",
  "Fitness",
  "Gaming",
  "Dancing",
  "Swimming",
];

// Additional options
const ADDITIONAL_OPTIONS = ["Smoking Area", "Concierge"];

export const AmenitiesStep: React.FC<AmenitiesStepProps> = ({
  formData,
  onToggle,
}) => {
  return (
    <StepWrapper
      title="Step 8"
      description="Step 7"
    >
      <StepContainer>
        {/* Amenities - Multi Select in Grid */}
        <StepHeader title="Amenities" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
          {AMENITIES_OPTIONS.map((amenity) => (
            <SelectionButton
              key={amenity}
              label={amenity}
              value={amenity}
              isSelected={formData.amenities_preferences?.includes(amenity) || false}
              onClick={() => onToggle("amenities_preferences", amenity)}
            />
          ))}
          {/* Additional Options - now in the same grid */}
          {ADDITIONAL_OPTIONS.map((option) => (
            <SelectionButton
              key={option}
              label={option}
              value={option}
              isSelected={formData.additional_preferences?.includes(option) || false}
              onClick={() => onToggle("additional_preferences", option)}
            />
          ))}
        </div>
      </StepContainer>
    </StepWrapper>
  );
};

