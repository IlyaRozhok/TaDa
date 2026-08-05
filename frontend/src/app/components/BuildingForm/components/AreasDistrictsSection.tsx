import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { MultiSelectDropdown } from "@/app/components/form/MultiSelectDropdown";
import {
  AREA_OPTIONS,
  LONDON_DISTRICTS,
} from "@/constants/admin-form-options";
import type { BuildingFormData } from "../types";

const AREA_MS_OPTIONS = AREA_OPTIONS.map((area) => ({
  value: area,
  label: area,
}));

const DISTRICT_MS_OPTIONS = LONDON_DISTRICTS.map((district) => ({
  value: district,
  label: district,
}));

interface AreasDistrictsSectionProps {
  formData: BuildingFormData;
  setFormData: Dispatch<SetStateAction<BuildingFormData>>;
  openDropdown: string | null;
  onToggleDropdown: (name: string) => void;
  mode: "create" | "edit";
}

/**
 * Areas and Districts multi-selects. A fragment of two sibling blocks, so
 * the form's flat child order stays exactly as it was in the monolith.
 * Edit mode never had an Areas control, so it renders Districts only; the
 * districts testids exist only in edit, where the e2e drives them.
 */
export const AreasDistrictsSection: React.FC<AreasDistrictsSectionProps> = ({
  formData,
  setFormData,
  openDropdown,
  onToggleDropdown,
  mode,
}) => {
  return (
    <>
      {/* Areas */}
      {mode === "create" && (
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Areas
          </label>
          <MultiSelectDropdown
            name="areas"
            values={formData.areas}
            options={AREA_MS_OPTIONS}
            placeholder="Select areas..."
            openDropdown={openDropdown}
            onToggleDropdown={onToggleDropdown}
            onOptionClick={(area) => {
              const newAreas = formData.areas.includes(area)
                ? formData.areas.filter((a) => a !== area)
                : [...formData.areas, area];
              setFormData({
                ...formData,
                areas: newAreas,
              });
            }}
            onChipRemove={(area) =>
              setFormData({
                ...formData,
                areas: formData.areas.filter((a) => a !== area),
              })
            }
          />
        </div>
      )}

      {/* Districts */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Districts
        </label>
        <MultiSelectDropdown
          name="districts"
          values={formData.districts}
          options={DISTRICT_MS_OPTIONS}
          placeholder="Select districts..."
          openDropdown={openDropdown}
          onToggleDropdown={onToggleDropdown}
          toggleTestId={mode === "edit" ? "building-edit-districts" : undefined}
          optionsTestId={
            mode === "edit" ? "building-edit-districts-options" : undefined
          }
          onOptionClick={(district) => {
            const newDistricts = formData.districts.includes(district)
              ? formData.districts.filter((d) => d !== district)
              : [...formData.districts, district];
            setFormData({
              ...formData,
              districts: newDistricts,
            });
          }}
          onChipRemove={(district) =>
            setFormData({
              ...formData,
              districts: formData.districts.filter((d) => d !== district),
            })
          }
        />
      </div>
    </>
  );
};
