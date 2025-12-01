import React, { useState, useEffect } from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { InputField } from "../ui/InputField";
import { ChevronDown } from "lucide-react";
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
  const [isDogSizeOpen, setIsDogSizeOpen] = useState(false);

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
      title="Step 6"
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
              <div className="relative">
                <div
                  onClick={() => setIsDogSizeOpen(!isDogSizeOpen)}
                  className="w-full px-6 pt-8 pb-4 pr-12 bg-white rounded-3xl cursor-pointer flex items-center justify-between border-0 shadow-sm"
                >
                  <span className={dogSize ? "text-gray-900" : "text-gray-400"}>
                    {dogSize || "Select dog size"}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isDogSizeOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <label
                  className={`absolute left-6 pointer-events-none transition-all duration-200 ${
                    dogSize
                      ? "top-3 text-xs text-gray-500"
                      : "top-1/2 -translate-y-1/2 text-base text-gray-400"
                  }`}
                >
                  Dog size
                </label>
                {isDogSizeOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-3xl shadow-lg border border-gray-200">
                    {DOG_SIZE_OPTIONS.map((size) => (
                      <div
                        key={size}
                        onClick={() => {
                          onUpdate("dog_size", size);
                          setIsDogSizeOpen(false);
                        }}
                        className={`px-6 py-4 cursor-pointer hover:bg-gray-50 first:rounded-t-3xl last:rounded-b-3xl ${
                          dogSize === size ? "bg-gray-100" : ""
                        }`}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </StepContainer>
    </StepWrapper>
  );
};

