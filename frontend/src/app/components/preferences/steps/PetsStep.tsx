import React from "react";
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

export const PetsStep: React.FC<PetsStepProps> = ({
  formData,
  onUpdate,
}) => {
  const selectedPetType = formData.pet_type_preferences?.[0] || "";
  const numberOfPets = formData.number_of_pets || "";
  const petAdditionalInfo = formData.pet_additional_info || "";

  return (
    <StepWrapper
      title="Step 6"
      description="Step 6"
    >
      <StepContainer>
        {/* Pet Type - Single Select (but stored as array for consistency) */}
        <StepHeader title="Pet Type" />
        <div className="space-y-4 mb-6">
          {PET_TYPE_OPTIONS.map((type) => (
            <SelectionButton
              key={type}
              label={type}
              value={type}
              isSelected={selectedPetType === type}
              onClick={() => {
                // Store as array but only allow one selection
                onUpdate("pet_type_preferences", [type]);
                // Clear additional info if "No pets" is selected
                if (type === "No pets") {
                  onUpdate("pet_additional_info", "");
                  onUpdate("number_of_pets", undefined);
                }
                // Clear additional info when switching away from "Other"
                if (type !== "Other" && selectedPetType === "Other") {
                  onUpdate("pet_additional_info", "");
                }
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

            {/* Specify an animal - show only for "Other" */}
            {selectedPetType === "Other" && (
              <InputField
                label="Specify an animal"
                value={petAdditionalInfo}
                onChange={(e) => onUpdate("pet_additional_info", e.target.value)}
                type="text"
                placeholder="e.g., Hamster, Rabbit, Bird..."
                required
              />
            )}

            {/* Additional info - show for Dog, Cat, Planning to get a pet (but not for Other) */}
            {selectedPetType !== "Other" && (
              <InputField
                label="Additional info (optional)"
                value={petAdditionalInfo}
                onChange={(e) => onUpdate("pet_additional_info", e.target.value)}
                type="text"
                placeholder="Any additional information about your pet..."
              />
            )}
          </div>
        )}
      </StepContainer>
    </StepWrapper>
  );
};

