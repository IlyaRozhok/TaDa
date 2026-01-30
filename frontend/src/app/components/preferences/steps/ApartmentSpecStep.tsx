import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { PreferencesFormData } from "@/app/types/preferences";
import { useTranslation } from "../../../hooks/useTranslation";
import { wizardKeys } from "../../../lib/translationsKeys/wizardTranslationKeys";

interface ApartmentSpecStepProps {
  formData: PreferencesFormData;
  onToggle: (category: keyof PreferencesFormData, value: string) => void;
}

// Tenant type values stored in form (labels from tenant.type.name.1–6)
const TENANT_TYPE_VALUES = [
  "Professional",
  "Student",
  "Corporate tenant",
  "Family",
  "Sharers / Friends",
  "Other",
];

export const ApartmentSpecStep: React.FC<ApartmentSpecStepProps> = ({
  formData,
  onToggle,
}) => {
  const { t } = useTranslation();

  return (
    <StepWrapper
      title={t(wizardKeys.step5.title)}
      description={t(wizardKeys.step5.subtitle)}
    >
      <StepContainer>
        {/* Tenant Type - Multi Select */}
        <StepHeader title={t(wizardKeys.step5.des.text1)} />
        <div className="space-y-4">
          {TENANT_TYPE_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(wizardKeys.step5.tenantType[i])}
              value={value}
              isSelected={
                formData.tenant_type_preferences?.includes(value) || false
              }
              onClick={() => onToggle("tenant_type_preferences", value)}
            />
          ))}
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
