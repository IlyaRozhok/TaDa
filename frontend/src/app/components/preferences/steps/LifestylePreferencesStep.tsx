import React, { useEffect } from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { GlassmorphismDropdown } from "../ui/GlassmorphismDropdown";
import { PreferencesFormData } from "@/entities/preferences/model/preferences";
import { Briefcase, Users, Baby } from "lucide-react";

interface LifestylePreferencesStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const OCCUPATION_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "young-professional", label: "Young professional" },
  { value: "freelancer-remote-worker", label: "Freelancer / Remote worker" },
  { value: "business-owner", label: "Business owner" },
  { value: "family-professional", label: "Family professional" },
  { value: "other", label: "Other" },
];

const FAMILY_STATUS_OPTIONS = [
  { value: "just-me", label: "Just me" },
  { value: "couple", label: "Couple" },
  { value: "couple-with-children", label: "Couple with children" },
  { value: "single-parent", label: "Single parent" },
  { value: "friends-flatmates", label: "Friends / flatmates" },
];

const CHILDREN_OPTIONS = [
  { value: "no", label: "No" },
  { value: "yes-1-child", label: "Yes, 1 child" },
  { value: "yes-2-children", label: "Yes, 2 children" },
  { value: "yes-3-plus-children", label: "Yes, 3+ children" },
];

export const LifestylePreferencesStep: React.FC<
  LifestylePreferencesStepProps
> = ({ formData, onUpdate, onValidationChange }) => {
  // Validation logic - all fields are optional, so always valid
  const isValid = (): boolean => {
    // Since lifestyle preferences are optional, the step is always valid
    // Users can complete onboarding without filling all fields
    return true;
  };

  // Notify parent of validation state changes
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
    <StepWrapper title="Step 8" description="About you">
      <StepContainer>
        <StepHeader title="Let's get to know you" />

        <div className="space-y-6">
          {/* Occupation */}
          <GlassmorphismDropdown
            label="Occupation"
            value={formData.occupation || ""}
            options={OCCUPATION_OPTIONS}
            onChange={(value) => onUpdate("occupation", value as string)}
            placeholder="What do you do?"
            icon={<Briefcase className="w-5 h-5 text-white" />}
            noPreferenceValue=""
          />

          {/* Family Status */}
          <GlassmorphismDropdown
            label="Family status"
            value={formData.family_status || ""}
            options={FAMILY_STATUS_OPTIONS}
            onChange={(value) => onUpdate("family_status", value as string)}
            placeholder="Who will live in the property?"
            icon={<Users className="w-5 h-5 text-white" />}
            noPreferenceValue=""
          />

          {/* Children */}
          <GlassmorphismDropdown
            label="Children"
            value={formData.children_count || ""}
            options={CHILDREN_OPTIONS}
            onChange={(value) => onUpdate("children_count", value as string)}
            placeholder="Do you have children?"
            icon={<Baby className="w-5 h-5 text-white" />}
            noPreferenceValue=""
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
