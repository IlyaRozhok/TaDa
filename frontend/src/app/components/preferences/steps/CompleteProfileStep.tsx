import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";

interface CompleteProfileStepProps {
  formData: {
    hobbies?: string[];
    [key: string]: unknown;
  };
  onUpdate: (field: string, value: unknown) => void;
  onToggle: (category: string, value: string) => void;
}

/** Section 1: title wizard.step9.des.text2, options personal.growth.name1–7. */
const SECTION1_VALUES = [
  "personal_growth_1",
  "personal_growth_2",
  "personal_growth_3",
  "personal_growth_4",
  "personal_growth_5",
  "personal_growth_6",
  "personal_growth_7",
];

/** Section 2: title wizard.step9.des.text3, options social.fun.name1–9. */
const SECTION2_VALUES = [
  "social_fun_1",
  "social_fun_2",
  "social_fun_3",
  "social_fun_4",
  "social_fun_5",
  "social_fun_6",
  "social_fun_7",
  "social_fun_8",
  "social_fun_9",
];

/** Section 3: title wizard.step9.des.text4, options sport.outdoors.name1–9. */
const SECTION3_VALUES = [
  "sport_outdoors_1",
  "sport_outdoors_2",
  "sport_outdoors_3",
  "sport_outdoors_4",
  "sport_outdoors_5",
  "sport_outdoors_6",
  "sport_outdoors_7",
  "sport_outdoors_8",
  "sport_outdoors_9",
];

/** Section 4: title wizard.step9.des.text5, options wellbeing.lifestyle.name1–10. */
const SECTION4_VALUES = [
  "wellbeing_lifestyle_1",
  "wellbeing_lifestyle_2",
  "wellbeing_lifestyle_3",
  "wellbeing_lifestyle_4",
  "wellbeing_lifestyle_5",
  "wellbeing_lifestyle_6",
  "wellbeing_lifestyle_7",
  "wellbeing_lifestyle_8",
  "wellbeing_lifestyle_9",
  "wellbeing_lifestyle_10",
];

/** Section 5: title wizard.step9.des.text6, options creative.cultural.name1–10. */
const SECTION5_VALUES = [
  "creative_cultural_1",
  "creative_cultural_2",
  "creative_cultural_3",
  "creative_cultural_4",
  "creative_cultural_5",
  "creative_cultural_6",
  "creative_cultural_7",
  "creative_cultural_8",
  "creative_cultural_9",
  "creative_cultural_10",
];

export const CompleteProfileStep: React.FC<CompleteProfileStepProps> = ({
  formData,
  onToggle,
}) => {
  const { t } = useTranslation();
  const k = wizardKeys.step9;

  return (
    <StepWrapper title={t(k.title)} description={t(k.subtitle)}>
      <StepContainer>
        <StepHeader title={t(k.des.text2)} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-6">
          {SECTION1_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(k.section1Options[i])}
              value={value}
              isSelected={formData.hobbies?.includes(value) ?? false}
              onClick={() => onToggle("hobbies", value)}
            />
          ))}
        </div>

        <StepHeader title={t(k.des.text3)} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-6">
          {SECTION2_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(k.section2Options[i])}
              value={value}
              isSelected={formData.hobbies?.includes(value) ?? false}
              onClick={() => onToggle("hobbies", value)}
            />
          ))}
        </div>

        <StepHeader title={t(k.des.text4)} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-6">
          {SECTION3_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(k.section3Options[i])}
              value={value}
              isSelected={formData.hobbies?.includes(value) ?? false}
              onClick={() => onToggle("hobbies", value)}
            />
          ))}
        </div>

        <StepHeader title={t(k.des.text5)} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-6">
          {SECTION4_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(k.section4Options[i])}
              value={value}
              isSelected={formData.hobbies?.includes(value) ?? false}
              onClick={() => onToggle("hobbies", value)}
            />
          ))}
        </div>

        <StepHeader title={t(k.des.text6)} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
          {SECTION5_VALUES.map((value, i) => (
            <SelectionButton
              key={value}
              label={t(k.section5Options[i])}
              value={value}
              isSelected={formData.hobbies?.includes(value) ?? false}
              onClick={() => onToggle("hobbies", value)}
            />
          ))}
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
