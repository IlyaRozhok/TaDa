import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { InputField } from "../ui/InputField";
import { MultiSelectDropdown } from "../ui/MultiSelectDropdown";

interface LocationStepProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
}

// Mock data for dropdowns
const MOCK_METRO_STATIONS = [
  "Central London",
  "King's Cross",
  "Oxford Circus",
  "Piccadilly Circus",
  "Waterloo",
  "London Bridge",
  "Canary Wharf",
  "Paddington",
  "Victoria",
  "Euston",
];

const MOCK_ESSENTIALS = [
  "Central London",
  "Grocery Store",
  "Pharmacy",
  "Bank",
  "Restaurant",
  "Cafe",
  "Gym",
  "Park",
  "School",
  "Hospital",
];

const MOCK_COMMUTE_TIMES = [
  "15 minutes",
  "30 minutes",
  "45 minutes",
  "1 hour",
  "1.5 hours",
  "2 hours",
];

export const LocationStep: React.FC<LocationStepProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <StepWrapper title="Step 1" description="Step 1">
      <StepContainer>
        {/* Address Input */}
        <div className="mb-6">
          <InputField
            label="Address"
            value={formData.preferred_address || ""}
            onChange={(e) => onUpdate("preferred_address", e.target.value)}
            type="text"
            placeholder="Enter your desired address"
          />
        </div>

        {/* Metro Station - Multi Select */}
        <div className="mb-6">
          <MultiSelectDropdown
            label="Metro Station"
            value={formData.preferred_metro_stations || []}
            onChange={(value) => onUpdate("preferred_metro_stations", value)}
            options={MOCK_METRO_STATIONS}
            placeholder="Select metro stations"
          />
        </div>

        {/* Essentials - Multi Select */}
        <div className="mb-6">
          <MultiSelectDropdown
            label="Essentials"
            value={formData.preferred_essentials || []}
            onChange={(value) => onUpdate("preferred_essentials", value)}
            options={MOCK_ESSENTIALS}
            placeholder="Select essentials"
          />
        </div>

        {/* Commute Time - Multi Select */}
        <div>
          <MultiSelectDropdown
            label="Commute time"
            value={formData.preferred_commute_times || []}
            onChange={(value) => onUpdate("preferred_commute_times", value)}
            options={MOCK_COMMUTE_TIMES}
            placeholder="Select commute times"
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
