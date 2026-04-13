import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { PreferencesFormData } from "@/app/types/preferences";
import { PROPERTY_AMENITIES_GROUPS } from "@/constants/property-amenities";

interface PropertyAmenitiesStepProps {
  formData: PreferencesFormData;
  onToggle: (category: keyof PreferencesFormData, value: string) => void;
}

export const PropertyAmenitiesStep: React.FC<PropertyAmenitiesStepProps> = ({
  formData,
  onToggle,
}) => {
  const { t } = useTranslation();

  return (
    <StepWrapper
      title={t("preferences.home.amenities.title")}
      description={t("preferences.home.amenities.subtitle")}
    >
      <StepContainer>
        {PROPERTY_AMENITIES_GROUPS.map((group) => (
          <React.Fragment key={group.titleKey}>
            <StepHeader title={t(group.titleKey)} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-6">
              {group.values.map((value, i) => (
                <SelectionButton
                  key={value}
                  label={t(group.labelKeys[i])}
                  value={value}
                  isSelected={
                    formData.property_amenities_preferences?.includes(value) ?? false
                  }
                  onClick={() =>
                    onToggle("property_amenities_preferences", value)
                  }
                />
              ))}
            </div>
          </React.Fragment>
        ))}
      </StepContainer>
    </StepWrapper>
  );
};
