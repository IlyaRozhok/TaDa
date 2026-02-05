import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import { PreferencesFormData } from "@/entities/preferences/model/preferences";

interface LivingEnvironmentStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: string, value: unknown) => void;
  onToggle: (category: string, value: string) => void;
}

/** Section 1: title wizard.step10.des.text1, options living.env.name1–7. */
const LIVING_ENV_VALUES = [
  "living_env_1",
  "living_env_2",
  "living_env_3",
  "living_env_4",
  "living_env_5",
  "living_env_6",
  "living_env_7",
];

/** Section 2: title wizard.step10.des.text2, options smoker.answer.name1–2. API expects "non-smoker" | "smoker". */
const SMOKER_VALUES = ["non-smoker", "smoker"] as const;

export const LivingEnvironmentStep: React.FC<LivingEnvironmentStepProps> = ({
  formData,
  onToggle,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const k = wizardKeys.step10;

  const handleIdealLivingToggle = (value: string) => {
    const current = formData.ideal_living_environment || [];
    const isSelected = current.includes(value);
    const updated = isSelected
      ? current.filter((v) => v !== value)
      : [...current, value];
    onUpdate("ideal_living_environment", updated);
  };

  return (
    <StepWrapper title={t(k.title)} description={t(k.subtitle)}>
      <StepContainer>
        <div className="mb-6">
          <StepHeader title={t(k.des.text1)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
            {LIVING_ENV_VALUES.map((value, i) => (
              <SelectionButton
                key={value}
                label={t(k.livingEnvOptions[i])}
                value={value}
                isSelected={
                  formData.ideal_living_environment?.includes(value) ?? false
                }
                onClick={() => handleIdealLivingToggle(value)}
              />
            ))}
          </div>
        </div>

        <div>
          <StepHeader title={t(k.des.text2)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
            {SMOKER_VALUES.map((value, i) => (
              <SelectionButton
                key={value}
                label={t(k.smokerAnswerOptions[i])}
                value={value}
                isSelected={formData.smoker === value}
                onClick={() => {
                  if (formData.smoker === value) {
                    onUpdate("smoker", "");
                  } else {
                    onUpdate("smoker", value);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
