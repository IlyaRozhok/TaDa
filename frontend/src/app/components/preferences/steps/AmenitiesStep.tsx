import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { PreferencesFormData } from "@/app/types/preferences";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import { AMENITIES_VALUES } from "@/shared/constants/amenities";

interface AmenitiesStepProps {
  formData: PreferencesFormData;
  onToggle: (category: keyof PreferencesFormData, value: string) => void;
}

// Section 1: title wizard.step7.des.text1; labels amenities.name1–5 + name7–10 (name6 unused).
const SECTION1_VALUES = AMENITIES_VALUES.slice(0, 9);

// Section 2: services — amenities.name11–15 + preferences.amenities.smoking.area.
const SECTION2_VALUES = AMENITIES_VALUES.slice(9, 15);

// Section 3: safety — amenities.name16–18.
const SECTION3_VALUES = AMENITIES_VALUES.slice(15, 18);

// Section 4: pets — amenities.name19–20.
const SECTION4_VALUES = AMENITIES_VALUES.slice(18, 20);

// Section 5: family — amenities.name21–22.
const SECTION5_VALUES = AMENITIES_VALUES.slice(20, 22);

export const AmenitiesStep: React.FC<AmenitiesStepProps> = ({
  formData,
  onToggle,
}) => {
  const { t } = useTranslation();

  const k = wizardKeys.step8;
  const section1LabelKeys = k.section1Options;
  const section2LabelKeys = k.section2Options;
  const section3LabelKeys = k.section3Options;
  const section4LabelKeys = k.section4Options;
  const section5LabelKeys = k.section5Options;

  return (
    <StepWrapper
      title={t("preferences.building.amenities.title")}
      description={t("preferences.building.amenities.subtitle")}
    >
      <StepContainer>
        {/* Section 1: title des.text1, options amenities.name1–9 */}
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

        {/* Section 2: services (incl. smoking area) */}
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
