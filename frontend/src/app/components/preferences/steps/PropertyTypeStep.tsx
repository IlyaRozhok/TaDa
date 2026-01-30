import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { PreferencesFormData } from "@/app/types/preferences";
import { useTranslation } from "../../../hooks/useTranslation";
import { wizardKeys } from "../../../lib/translationsKeys/wizardTranslationKeys";

interface PropertyTypeStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
  onToggle: (category: keyof PreferencesFormData, value: string) => void;
}

// Building style values stored in form (labels from buildtype.name1–4)
const BUILDING_STYLE_VALUES = [
  "BTR",
  "Co-living",
  "Professional Management",
  "Private Landlord",
];

// Duration values stored in form (labels from rental.duration.name1–4)
const DURATION_VALUES = [
  "Short term (1–6 months)",
  "Medium term (6–12 months)",
  "Long term (12+ months)",
  "Flexible",
];

// Bills values stored in form (labels from bills.name1–2)
const BILLS_VALUES = ["Include", "Exclude"];

export const PropertyTypeStep: React.FC<PropertyTypeStepProps> = ({
  formData,
  onUpdate,
  onToggle,
}) => {
  const { t } = useTranslation();

  return (
    <StepWrapper
      title={t(wizardKeys.step4.title)}
      description={t(wizardKeys.step4.subtitle)}
    >
      <StepContainer>
        {/* Building style preferences - Multi Select */}
        <StepHeader title={t(wizardKeys.step4.des.text1)} />
        <div className="space-y-4 mb-6">
          {BUILDING_STYLE_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(wizardKeys.step4.buildtype[i])}
              value={value}
              isSelected={
                formData.building_style_preferences?.includes(value) || false
              }
              onClick={() => onToggle("building_style_preferences", value)}
            />
          ))}
        </div>

        {/* Duration - Single Select */}
        <StepHeader title={t(wizardKeys.step4.des.text2)} />
        <div className="space-y-4 mb-6">
          {DURATION_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(wizardKeys.step4.rentalDuration[i])}
              value={value}
              isSelected={formData.selected_duration === value}
              onClick={() => onUpdate("selected_duration", value)}
            />
          ))}
        </div>

        {/* Bills - Single Select */}
        <StepHeader title={t(wizardKeys.step4.des.text3)} />
        <div className="space-y-4">
          {BILLS_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(wizardKeys.step4.bills[i])}
              value={value}
              isSelected={formData.selected_bills === value}
              onClick={() => onUpdate("selected_bills", value)}
            />
          ))}
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
