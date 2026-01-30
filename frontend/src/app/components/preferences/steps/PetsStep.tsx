import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { InputField } from "../ui/InputField";
import { PreferencesFormData } from "@/app/types/preferences";
import { useTranslation } from "../../../hooks/useTranslation";
import { wizardKeys } from "../../../lib/translationsKeys/wizardTranslationKeys";

interface PetsStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
}

// Pet type values stored in form (labels from pet.type.name1–5)
const PET_TYPE_VALUES = [
  "No pets",
  "Dog",
  "Cat",
  "Other",
  "Planning to get a pet",
];

export const PetsStep: React.FC<PetsStepProps> = ({ formData, onUpdate }) => {
  const { t } = useTranslation();
  const selectedPetType = formData.pet_type_preferences?.[0] || "";
  const numberOfPets = formData.number_of_pets || "";
  const petAdditionalInfo = formData.pet_additional_info || "";

  return (
    <StepWrapper
      title={t(wizardKeys.step6.title)}
      description={t(wizardKeys.step6.subtitle)}
    >
      <StepContainer>
        {/* Pet Type - Single Select (but stored as array for consistency) */}
        <StepHeader title={t(wizardKeys.step6.des.text1)} />
        <div className="space-y-4 mb-6">
          {PET_TYPE_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(wizardKeys.step6.petType[i])}
              value={value}
              isSelected={selectedPetType === value}
              onClick={() => {
                onUpdate("pet_type_preferences", [value]);
                if (value === "No pets") {
                  onUpdate("pet_additional_info", "");
                  onUpdate("number_of_pets", undefined);
                }
                if (value !== "Other" && selectedPetType === "Other") {
                  onUpdate("pet_additional_info", "");
                }
              }}
            />
          ))}
        </div>

        {/* Optional fields - only show if pet is selected */}
        {(selectedPetType === "Dog" ||
          selectedPetType === "Cat" ||
          selectedPetType === "Other" ||
          selectedPetType === "Planning to get a pet") && (
          <div className="space-y-6">
            <StepHeader title={t(wizardKeys.step6.des.text2)} />

            {/* Number of pets */}
            <InputField
              label={t(wizardKeys.step6.numberPets)}
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
                onChange={(e) =>
                  onUpdate("pet_additional_info", e.target.value)
                }
                type="text"
                placeholder="e.g., Hamster, Rabbit, Bird..."
                required
              />
            )}

            {/* Additional info - show for Dog, Cat, Planning to get a pet (but not for Other) */}
            {selectedPetType !== "Other" && (
              <InputField
                label={t(wizardKeys.step6.additionalField)}
                value={petAdditionalInfo}
                onChange={(e) =>
                  onUpdate("pet_additional_info", e.target.value)
                }
                type="text"
                placeholder={t(wizardKeys.step6.optionalText)}
              />
            )}
          </div>
        )}
      </StepContainer>
    </StepWrapper>
  );
};
