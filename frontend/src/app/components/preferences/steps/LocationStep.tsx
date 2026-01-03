import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { InputField } from "../ui/InputField";
import { MultiSelectDropdown } from "../ui/MultiSelectDropdown";
import { PreferencesFormData } from "@/app/types/preferences";

interface LocationStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
}

const AREAS = ["West", "East", "North", "South", "Center"];

const LONDON_DISTRICTS = [
  "Barking and Dagenham",
  "Barnet",
  "Bexley",
  "Brent",
  "Bromley",
  "Camden",
  "City of London",
  "Croydon",
  "Ealing",
  "Enfield",
  "Greenwich",
  "Hackney",
  "Hammersmith and Fulham",
  "Haringey",
  "Harrow",
  "Havering",
  "Hillingdon",
  "Hounslow",
  "Islington",
  "Kensington and Chelsea",
  "Kingston upon Thames",
  "Lambeth",
  "Lewisham",
  "Merton",
  "Newham",
  "Redbridge",
  "Richmond upon Thames",
  "Southwark",
  "Sutton",
  "Tower Hamlets",
  "Waltham Forest",
  "Wandsworth",
  "Westminster",
];

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

export const LocationStep: React.FC<LocationStepProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <StepWrapper title="Step 1" description="Step 1">
      <StepContainer>
        {/* Areas - Multi Select */}
        <div className="mb-6">
          <MultiSelectDropdown
            label="Areas"
            value={formData.preferred_areas || []}
            onChange={(value) => onUpdate("preferred_areas", value)}
            options={AREAS}
            placeholder="Select areas"
          />
        </div>

        {/* Districts - Multi Select */}
        <div className="mb-6">
          <MultiSelectDropdown
            label="Districts"
            value={formData.preferred_districts || []}
            onChange={(value) => onUpdate("preferred_districts", value)}
            options={LONDON_DISTRICTS}
            placeholder="Select London districts"
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
      </StepContainer>
    </StepWrapper>
  );
};
