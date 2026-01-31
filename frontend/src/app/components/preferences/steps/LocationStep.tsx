import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { InputField } from "../ui/InputField";
import { MultiSelectDropdown } from "../ui/MultiSelectDropdown";
import { PreferencesFormData } from "@/app/types/preferences";
import { useTranslation } from "../../../hooks/useTranslation";
import { wizardKeys } from "../../../lib/translationsKeys/wizardTranslationKeys";
import {
  AREA_OPTIONS,
  DISTRICTS_BY_AREA,
  LONDON_METRO_STATIONS,
} from "../../../../shared/constants/admin-form-options";

interface LocationStepProps {
  formData: PreferencesFormData;
  onUpdate: (field: keyof PreferencesFormData, value: unknown) => void;
}

const AREAS = AREA_OPTIONS;

const DISTRICT_OPTION_GROUPS = DISTRICTS_BY_AREA.map((g) => ({
  label: g.area,
  options: [...g.districts],
}));

export const LocationStep: React.FC<LocationStepProps> = ({
  formData,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const preferredAreas = formData.preferred_areas || [];
  const preferredDistricts = formData.preferred_districts || [];

  // Districts only for selected areas; when areas change, clear districts that no longer belong to any selected area
  const districtOptionGroups =
    preferredAreas.length > 0
      ? DISTRICT_OPTION_GROUPS.filter((g) => preferredAreas.includes(g.label))
      : [];

  const handleAreasChange = (newAreas: string[]) => {
    onUpdate("preferred_areas", newAreas);
    if (newAreas.length === 0) {
      onUpdate("preferred_districts", []);
      return;
    }
    const allowedDistricts = new Set(
      DISTRICT_OPTION_GROUPS.filter((g) => newAreas.includes(g.label)).flatMap(
        (g) => g.options,
      ),
    );
    const cleaned = preferredDistricts.filter((d) => allowedDistricts.has(d));
    if (cleaned.length !== preferredDistricts.length) {
      onUpdate("preferred_districts", cleaned);
    }
  };

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
            value={preferredAreas}
            onChange={handleAreasChange}
            options={AREAS}
            placeholder={t(wizardKeys.step1.areas)}
          />
        </div>

        {/* Districts - only for selected areas; grouped by area */}
        {districtOptionGroups.length > 0 && (
          <div className="mb-6">
            <MultiSelectDropdown
              label={t(wizardKeys.step1.districts)}
              value={preferredDistricts}
              onChange={(value) => onUpdate("preferred_districts", value)}
              optionGroups={districtOptionGroups}
              placeholder={t(wizardKeys.step1.districts)}
            />
          </div>
        )}

        {/* Metro Station - Multi Select with search (opens upward for visibility) */}
        <div className="mb-6">
          <MultiSelectDropdown
            label={t(wizardKeys.step1.metro.station)}
            value={formData.preferred_metro_stations || []}
            onChange={(value) => onUpdate("preferred_metro_stations", value)}
            options={[...LONDON_METRO_STATIONS]}
            placeholder={t(wizardKeys.step1.metro.station)}
            searchable
            openUpward
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
