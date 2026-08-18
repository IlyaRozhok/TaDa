import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { MultiSelectDropdown } from "@/app/components/form/MultiSelectDropdown";
import type { EditPropertyFormData } from "../types";
import {
  AMENITIES_BY_CATEGORY,
  PROPERTY_AMENITIES_BY_CATEGORY,
} from "@/constants/admin-form-options";
import { translateAmenityStoredLabel } from "@/constants/amenities";
import { useTranslation } from "@/app/hooks/useTranslation";

interface EditAmenitiesSectionProps {
  formData: EditPropertyFormData;
  setFormData: Dispatch<SetStateAction<EditPropertyFormData>>;
  openDropdown: string | null;
  toggleDropdown: (name: string) => void;
  isFieldReadonly: boolean;
  toggleAmenity: (amenity: string) => void;
  togglePropertyAmenity: (amenity: string) => void;
}

/**
 * Building-level amenities (readonly-aware) and the apartment-level
 * "What's Included" list, on the shared primitive. The amenities lock is
 * the softer `cursor-default opacity-80` the monolith used.
 */
export const EditAmenitiesSection: React.FC<EditAmenitiesSectionProps> = ({
  formData,
  setFormData,
  openDropdown,
  toggleDropdown,
  isFieldReadonly,
  toggleAmenity,
  togglePropertyAmenity,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Property Features - Amenities (multi-select dropdown, same as building) */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Amenities{" "}
          {isFieldReadonly && (
            <span className="text-white/50 text-xs">(from building)</span>
          )}
        </label>
        <MultiSelectDropdown
          name="amenities"
          values={formData.amenities || []}
          groups={AMENITIES_BY_CATEGORY.map((category) => ({
            title: category.title,
            options: category.values.map((amenity) => ({
              value: amenity,
              label: translateAmenityStoredLabel(amenity, t),
            })),
          }))}
          placeholder="Select amenities..."
          openDropdown={openDropdown}
          onToggleDropdown={toggleDropdown}
          readonly={isFieldReadonly}
          readonlyClassName="cursor-default opacity-80"
          getChipLabel={(amenity) => translateAmenityStoredLabel(amenity, t)}
          onOptionClick={(amenity) => toggleAmenity(amenity)}
          onChipRemove={(amenity) =>
            setFormData({
              ...formData,
              amenities: (formData.amenities || []).filter(
                (a) => a !== amenity,
              ),
            })
          }
        />
      </div>

      {/* What's Included (apartment-level features) */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          What's Included
        </label>
        <MultiSelectDropdown
          name="property_amenities"
          values={formData.property_amenities || []}
          groups={PROPERTY_AMENITIES_BY_CATEGORY.map((category) => ({
            title: t(category.titleKey),
            options: category.values.map((amenity) => ({
              value: amenity,
              label: amenity,
            })),
          }))}
          placeholder="Select features..."
          openDropdown={openDropdown}
          onToggleDropdown={toggleDropdown}
          focusRing={false}
          readonly={false}
          onOptionClick={(amenity) => togglePropertyAmenity(amenity)}
          onChipRemove={(amenity) =>
            setFormData({
              ...formData,
              property_amenities: (formData.property_amenities || []).filter(
                (a) => a !== amenity,
              ),
            })
          }
        />
      </div>
    </>
  );
};
