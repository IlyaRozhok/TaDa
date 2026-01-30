import React, { useEffect } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { TextAreaField } from "../step-components/TextAreaField";
import { PreferencesFormData } from "@/app/types/preferences";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";

interface AboutYouStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const AboutYouStep: React.FC<AboutYouStepProps> = ({
  formData,
  onUpdate,
  onValidationChange,
}) => {
  const { t } = useTranslation();
  const k = wizardKeys.step11;

  const isValid = (): boolean => true;

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid());
    }
  }, [formData.additional_info, onValidationChange]);

  return (
    <StepWrapper title={t(k.title)} description={t(k.subtitle)}>
      <StepContainer>
        <div className="space-y-6">
          <TextAreaField
            label={t(k.des.text1)}
            value={formData.additional_info || ""}
            onChange={(value) => onUpdate("additional_info", value)}
            placeholder={t(k.des.textField)}
            rows={8}
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
