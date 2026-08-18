import React, { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { MultiSelectDropdown } from "@/app/components/form/MultiSelectDropdown";
import { AMENITIES_BY_CATEGORY } from "@/constants/admin-form-options";
import { translateAmenityStoredLabel } from "@/constants/amenities";
import { useTranslation } from "@/app/hooks/useTranslation";
import type { BuildingFormData } from "../types";

interface AmenitiesSectionProps {
  formData: BuildingFormData;
  setFormData: Dispatch<SetStateAction<BuildingFormData>>;
  openDropdown: string | null;
  onToggleDropdown: (name: string) => void;
}

export const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({
  formData,
  setFormData,
  openDropdown,
  onToggleDropdown,
}) => {
  const { t } = useTranslation();

  const amenityGroups = useMemo(
    () =>
      AMENITIES_BY_CATEGORY.map((category) => ({
        title: category.title,
        options: category.values.map((amenity) => ({
          value: amenity,
          label: translateAmenityStoredLabel(amenity, t),
        })),
      })),
    [t],
  );

  return (
    <div>
      <label className="block text-sm font-medium text-white/90 mb-2">
        Amenities
      </label>
      <MultiSelectDropdown
        name="amenities"
        values={formData.amenities}
        groups={amenityGroups}
        placeholder="Select amenities..."
        openDropdown={openDropdown}
        onToggleDropdown={onToggleDropdown}
        getChipLabel={(amenity) => translateAmenityStoredLabel(amenity, t)}
        onOptionClick={(amenity) => {
          const newAmenities = formData.amenities.includes(amenity)
            ? formData.amenities.filter((a) => a !== amenity)
            : [...formData.amenities, amenity];
          setFormData({
            ...formData,
            amenities: newAmenities,
          });
        }}
        onChipRemove={(amenity) =>
          setFormData({
            ...formData,
            amenities: formData.amenities.filter((a) => a !== amenity),
          })
        }
      />
    </div>
  );
};
