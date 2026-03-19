import React, { useEffect, useMemo } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { SelectionButton } from "../step-components/SelectionButton";
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
  const toggleMultiValue = (
    field: "occupation" | "family_status" | "children_count",
    value: string,
  ) => {
    const current = (formData[field] as string[] | undefined) || [];

    if (field === "children_count") {
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : value === "no"
          ? ["no"]
          : [...current.filter((item) => item !== "no"), value];
      onUpdate(field, next);
      return;
    }

    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onUpdate(field, next);
  };

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
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              {t(k.field1.title)}
            </h4>
            {occupationOptions.map((option) => (
              <SelectionButton
                key={option.value}
                label={option.label}
                value={option.value}
                icon={Briefcase}
                isSelected={(formData.occupation || []).includes(option.value)}
                onClick={(value) => toggleMultiValue("occupation", value)}
              />
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              {t(k.field2.title)}
            </h4>
            {familyStatusOptions.map((option) => (
              <SelectionButton
                key={option.value}
                label={option.label}
                value={option.value}
                icon={Users}
                isSelected={(formData.family_status || []).includes(
                  option.value,
                )}
                onClick={(value) => toggleMultiValue("family_status", value)}
              />
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              {t(k.field3.title)}
            </h4>
            {childrenOptions.map((option) => (
              <SelectionButton
                key={option.value}
                label={option.label}
                value={option.value}
                icon={Baby}
                isSelected={(formData.children_count || []).includes(
                  option.value,
                )}
                onClick={(value) => toggleMultiValue("children_count", value)}
              />
            ))}
          </div>
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
