import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { BedroomsDropdown, FurnishingDropdown } from "../ui";

interface ApartmentSpecStepProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
}

export const ApartmentSpecStep: React.FC<ApartmentSpecStepProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <StepWrapper
      title="Specify your apartment"
      description="Select how you'll be using platform. For now one account - one role"
    >
      <StepContainer>
        <StepHeader title="Bedrooms and furnishing" />

        <div className="space-y-8">
          <BedroomsDropdown
            label="Bedrooms (min)"
            value={formData.min_bedrooms || ""}
            onChange={(value) =>
              onUpdate("min_bedrooms", value === "" ? undefined : value)
            }
            placeholder="No Preference"
            min={true}
          />

          <BedroomsDropdown
            label="Bedrooms (max)"
            value={formData.max_bedrooms || ""}
            onChange={(value) =>
              onUpdate("max_bedrooms", value === "" ? undefined : value)
            }
            placeholder="No Preference"
            min={false}
          />

          <FurnishingDropdown
            label="Furnishing"
            value={formData.furnishing || "no-preference"}
            onChange={(value) => onUpdate("furnishing", value)}
            placeholder="No Preference"
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
