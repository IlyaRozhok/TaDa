import React, { useEffect, useMemo } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { GlassmorphismDropdown } from "../ui/GlassmorphismDropdown";
import { PreferencesFormData } from "@/entities/preferences/model/preferences";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import { Briefcase, Users, Baby } from "lucide-react";

interface LifestylePreferencesStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
  onValidationChange?: (isValid: boolean) => void;
}

/** API values for occupation (labels from occupation.name1–6). */
const OCCUPATION_VALUES = [
  "student",
  "young-professional",
  "freelancer-remote-worker",
  "business-owner",
  "family-professional",
  "other",
];

/** API values for family status (labels from family.status.name1–5). */
const FAMILY_STATUS_VALUES = [
  "just-me",
  "couple",
  "couple-with-children",
  "single-parent",
  "friends-flatmates",
];

/** API values for children (labels from children.status.name1–4). */
const CHILDREN_VALUES = [
  "no",
  "yes-1-child",
  "yes-2-children",
  "yes-3-plus-children",
];

export const LifestylePreferencesStep: React.FC<
  LifestylePreferencesStepProps
> = ({ formData, onUpdate, onValidationChange }) => {
  const { t } = useTranslation();
  const k = wizardKeys.step8;

  const occupationOptions = useMemo(
    () =>
      OCCUPATION_VALUES.map((value, i) => ({
        value,
        label: t(k.occupationOptions[i]),
      })),
    [t, k.occupationOptions],
  );
  const familyStatusOptions = useMemo(
    () =>
      FAMILY_STATUS_VALUES.map((value, i) => ({
        value,
        label: t(k.familyStatusOptions[i]),
      })),
    [t, k.familyStatusOptions],
  );
  const childrenOptions = useMemo(
    () =>
      CHILDREN_VALUES.map((value, i) => ({
        value,
        label: t(k.childrenStatusOptions[i]),
      })),
    [t, k.childrenStatusOptions],
  );

  const isValid = (): boolean => true;

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid());
    }
  }, [
    formData.occupation,
    formData.family_status,
    formData.children_count,
    onValidationChange,
  ]);

  return (
    <StepWrapper title={t(k.title)} description={t(k.subtitle)}>
      <StepContainer>
        <StepHeader title={t(k.des.text1)} />

        <div className="space-y-6">
          <GlassmorphismDropdown
            label={t(k.field1.title)}
            value={formData.occupation || ""}
            options={occupationOptions}
            onChange={(value) => onUpdate("occupation", value as string)}
            placeholder={t(k.field1.title)}
            icon={<Briefcase className="w-5 h-5 text-white" />}
            noPreferenceValue=""
          />

          <GlassmorphismDropdown
            label={t(k.field2.title)}
            value={formData.family_status || ""}
            options={familyStatusOptions}
            onChange={(value) => onUpdate("family_status", value as string)}
            placeholder={t(k.field2.title)}
            icon={<Users className="w-5 h-5 text-white" />}
            noPreferenceValue=""
          />

          <GlassmorphismDropdown
            label={t(k.field3.title)}
            value={formData.children_count || ""}
            options={childrenOptions}
            onChange={(value) => onUpdate("children_count", value as string)}
            placeholder={t(k.field3.title)}
            icon={<Baby className="w-5 h-5 text-white" />}
            noPreferenceValue=""
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
