import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { InputField } from "../ui/InputField";
import { MultiSelectDropdown } from "../ui/MultiSelectDropdown";
import { PreferencesFormData } from "@/app/types/preferences";
import { useTranslation } from "../../../hooks/useTranslation";
import { wizardKeys } from "../../../lib/translationsKeys/wizardTranslationKeys";

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
  const { t } = useTranslation();

  return (
    <StepWrapper
      title={t(wizardKeys.step1.title)}
      description={t(wizardKeys.step1.subtitle)}
    >
      <StepContainer>
        <StepHeader title={t(wizardKeys.step1.des.text)} />

        {/* Areas - Multi Select */}
        <div className="mb-6">
          <MultiSelectDropdown
            label={t(wizardKeys.step1.areas)}
            value={formData.preferred_areas || []}
            onChange={(value) => onUpdate("preferred_areas", value)}
            options={AREAS}
            placeholder={t(wizardKeys.step1.areas)}
          />
        </div>

        {/* Districts - Multi Select */}
        <div className="mb-6">
          <MultiSelectDropdown
            label={t(wizardKeys.step1.districts)}
            value={formData.preferred_districts || []}
            onChange={(value) => onUpdate("preferred_districts", value)}
            options={LONDON_DISTRICTS}
            placeholder={t(wizardKeys.step1.districts)}
          />
        </div>

        {/* Metro Station - Multi Select */}
        <div className="mb-6">
          <MultiSelectDropdown
            label={t(wizardKeys.step1.metro.station)}
            value={formData.preferred_metro_stations || []}
            onChange={(value) => onUpdate("preferred_metro_stations", value)}
            options={MOCK_METRO_STATIONS}
            placeholder={t(wizardKeys.step1.metro.station)}
          />
        </div>

        {/* Desired Address Input */}
        <div className="mb-6">
          <InputField
            label={t(wizardKeys.step1.des.address)}
            value={formData.preferred_address || ""}
            onChange={(e) => onUpdate("preferred_address", e.target.value)}
            type="text"
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
