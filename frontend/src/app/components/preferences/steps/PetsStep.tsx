import React, { useEffect } from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { InputField } from "../ui/InputField";
import { PreferencesFormData } from "@/app/types/preferences";

interface PetsStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
}

// Pet type options
const PET_TYPE_OPTIONS = ["No pets", "Dog", "Cat", "Other", "Planning to get a pet"];

// Dog size options
const DOG_SIZE_OPTIONS = [
  "Small (<10kg)",
  "Medium (10-25kg)",
  "Large (>25kg)",
];

export const PetsStep: React.FC<PetsStepProps> = ({
  formData,
  onUpdate,
}) => {
  const selectedPetType = formData.pet_type_preferences?.[0] || "";
  const numberOfPets = formData.number_of_pets || "";
  const dogSize = formData.dog_size || "";

  // Set default dog size to "Small" when Dog is selected
  useEffect(() => {
    if (selectedPetType === "Dog" && !dogSize) {
      onUpdate("dog_size", "Small (<10kg)");
    }
  }, [selectedPetType, dogSize, onUpdate]);

  return (
    <StepWrapper
      title="Step 7"
      description="Step 6"
    >
      <StepContainer>
        {/* Pet Type - Single Select (but stored as array for consistency) */}
        <StepHeader title="Pet Type" />
        <div className="space-y-4 mb-8">
          {PET_TYPE_OPTIONS.map((type) => (
            <SelectionButton
              key={type}
              label={type}
              value={type}
              isSelected={selectedPetType === type}
              onClick={() => {
                // Store as array but only allow one selection
                onUpdate("pet_type_preferences", [type]);
              }}
            />
          ))}
        </div>

        {/* Optional fields - only show if pet is selected */}
        {(selectedPetType === "Dog" || selectedPetType === "Cat" || selectedPetType === "Other" || selectedPetType === "Planning to get a pet") && (
          <div className="space-y-6">
            <StepHeader title="Optional fields" />
            
            {/* Number of pets */}
            <InputField
              label="Number of pets"
              value={numberOfPets}
              onChange={(e) => onUpdate("number_of_pets", e.target.value)}
              type="number"
              min={1}
            />

            {/* Dog size - only show for Dog */}
            {selectedPetType === "Dog" && (
              <div>
                <StepHeader title="Dog size" />
                <div className="space-y-4 mt-4">
                  {DOG_SIZE_OPTIONS.map((size) => (
                    <SelectionButton
                      key={size}
                      label={size}
                      value={size}
                      isSelected={dogSize === size}
                      onClick={() => {
                        // Single select - if already selected, deselect, otherwise select
                        if (dogSize === size) {
                          onUpdate("dog_size", null);
                        } else {
                          onUpdate("dog_size", size);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </StepContainer>
    </StepWrapper>
  );
};

