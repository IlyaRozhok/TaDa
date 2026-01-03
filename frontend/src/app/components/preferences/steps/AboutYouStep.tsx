import React, { useEffect } from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { TextAreaField } from "../step-components/TextAreaField";
import { InputField } from "../ui/InputField";
import { GlassmorphismDropdown } from "../ui/GlassmorphismDropdown";
import { PreferencesFormData } from "@/app/types/preferences";
import { Briefcase } from "lucide-react";

interface AboutYouStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const OCCUPATION_OPTIONS = [
  { value: "", label: "No Preference" },
  { value: "full-time-employed", label: "Full-time employed" },
  { value: "part-time-employed", label: "Part-time employed" },
  { value: "freelancer", label: "Freelancer" },
  { value: "student", label: "Student" },
  { value: "self-employed", label: "Self-employed" },
  { value: "retired", label: "Retired" },
];

export const AboutYouStep: React.FC<AboutYouStepProps> = ({
  formData,
  onUpdate,
  onValidationChange,
}) => {
  // Validation logic
  const isValid = () => {
    const hasAdditionalInfo = formData.additional_info && formData.additional_info.trim().length > 0;
    const hasOccupation = formData.occupation && formData.occupation !== "";
    const hasPreferredAddress = formData.preferred_address && formData.preferred_address.trim().length > 0;
    
    return hasAdditionalInfo && hasOccupation && hasPreferredAddress;
  };

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid());
    }
  }, [formData.additional_info, formData.occupation, formData.preferred_address, onValidationChange]);
  return (
    <StepWrapper title="Step 10" description="Step 10">
      <StepContainer>
        <div className="space-y-6">
          {/* About You */}
          <TextAreaField
            label="Tell about yourself"
            value={formData.additional_info || ""}
            onChange={(value) => onUpdate("additional_info", value)}
            placeholder="e.g., I'm a quiet professional who enjoys cooking and reading. I keep a clean living space and am always respectful of neighbors. I'm looking for a peaceful home environment where I can relax after work..."
            rows={8}
            required
          />

          {/* Container for Occupation and Desired Address */}
          <div className="px-8 space-y-6">
            {/* Occupation */}
            <GlassmorphismDropdown
              label="Occupation"
              value={formData.occupation || ""}
              options={OCCUPATION_OPTIONS}
              onChange={(value) => onUpdate("occupation", value as string)}
              placeholder="What do you do for work?"
              icon={<Briefcase className="w-5 h-5 text-white" />}
              noPreferenceValue=""
              required
            />

            {/* Desired Address Input */}
            <InputField
              label="Desired Address"
              value={formData.preferred_address || ""}
              onChange={(e) => onUpdate("preferred_address", e.target.value)}
              type="text"
              required
            />
          </div>
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
