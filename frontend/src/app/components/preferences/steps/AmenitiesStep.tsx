import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { PreferencesFormData } from "@/app/types/preferences";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";

interface AmenitiesStepProps {
  formData: PreferencesFormData;
  onToggle: (category: keyof PreferencesFormData, value: string) => void;
}

/** Section 1: title wizard.step7.des.text1, options des.text1–text10 (values for API unchanged). */
const SECTION1_VALUES = [
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
];

/** Section 2: title wizard.step7.des.text2, options amenities.name11–15. */
const SECTION2_VALUES = [
  "Maintenance",
  "Events calendar",
  "Pet areas",
  "Kids' room",
  "Garden",
];

/** Section 3: title wizard.step7.des.text3, options amenities.name16–18. */
const SECTION3_VALUES = ["Reading", "Music", "Art"];

/** Section 4: title wizard.step7.des.text4, options amenities.name19–20. */
const SECTION4_VALUES = ["Hiking", "Cooking"];

/** Section 5: title wizard.step7.des.text5, options amenities.name21–22. */
const SECTION5_VALUES = ["Travel", "Sport"];

export const AmenitiesStep: React.FC<AmenitiesStepProps> = ({
  formData,
  onToggle,
}) => {
  const { t } = useTranslation();

  const k = wizardKeys.step7;
  const section1LabelKeys = k.section1Options;
  const section2LabelKeys = k.section2Options;
  const section3LabelKeys = k.section3Options;
  const section4LabelKeys = k.section4Options;
  const section5LabelKeys = k.section5Options;

  return (
    <StepWrapper title={t(k.title)} description={t(k.subtitle)}>
      <StepContainer>
        {/* Section 1: title des.text1, options des.text1–text10 */}
        <StepHeader title={t(k.des.text1)} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-6">
          {SECTION1_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(section1LabelKeys[i])}
              value={value}
              isSelected={
                formData.amenities_preferences?.includes(value) ?? false
              }
              onClick={() => onToggle("amenities_preferences", value)}
            />
          ))}
        </div>

        {/* Section 2: title des.text2, options amenities.name11–15 */}
        <StepHeader title={t(k.des.text2)} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-6">
          {SECTION2_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(section2LabelKeys[i])}
              value={value}
              isSelected={
                formData.amenities_preferences?.includes(value) ?? false
              }
              onClick={() => onToggle("amenities_preferences", value)}
            />
          ))}
        </div>

        {/* Section 3: title des.text3, options amenities.name16–18 */}
        <StepHeader title={t(k.des.text3)} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-6">
          {SECTION3_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(section3LabelKeys[i])}
              value={value}
              isSelected={
                formData.amenities_preferences?.includes(value) ?? false
              }
              onClick={() => onToggle("amenities_preferences", value)}
            />
          ))}
        </div>

        {/* Section 4: title des.text4, options amenities.name19–20 */}
        <StepHeader title={t(k.des.text4)} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-6">
          {SECTION4_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(section4LabelKeys[i])}
              value={value}
              isSelected={
                formData.amenities_preferences?.includes(value) ?? false
              }
              onClick={() => onToggle("amenities_preferences", value)}
            />
          ))}
        </div>

        {/* Section 5: title des.text5, options amenities.name21–22 */}
        <StepHeader title={t(k.des.text5)} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-6">
          {SECTION5_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(section5LabelKeys[i])}
              value={value}
              isSelected={
                formData.amenities_preferences?.includes(value) ?? false
              }
              onClick={() => onToggle("amenities_preferences", value)}
            />
          ))}
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
