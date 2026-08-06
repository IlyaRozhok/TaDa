import React from "react";
import { MultiSelectDropdown } from "@/app/components/form/MultiSelectDropdown";
import { PropertyFormData } from "../types";
import { AMENITIES_BY_CATEGORY, PROPERTY_AMENITIES_BY_CATEGORY } from "@/constants/admin-form-options";
import { translateAmenityStoredLabel } from "@/constants/amenities";
import { useTranslation } from "../../../hooks/useTranslation";

interface AmenitiesSectionProps {
  formData: PropertyFormData;
  errors: Record<string, string>;
  openDropdown: string | null;
  onFieldChange: (field: string, value: any) => void;
  onToggleDropdown: (dropdown: string) => void;
}

export const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({
  formData,
  openDropdown,
  onFieldChange,
  onToggleDropdown,
}) => {
  const { t } = useTranslation();
  const isReadonly =
    formData.building_type !== "private_landlord" && !!formData.building_id;

  const toggleAmenity = (amenity: string) => {
    if (isReadonly) return;
    const current = formData.amenities || [];
    const next = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    onFieldChange("amenities", next);
  };

  const togglePropertyAmenity = (amenity: string) => {
    const current = formData.property_amenities || [];
    const next = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    onFieldChange("property_amenities", next);
  };

  return (
    <div className="space-y-4">
      {/* Building-level amenities */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Amenities{" "}
          {isReadonly && (
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
          onToggleDropdown={onToggleDropdown}
          readonly={isReadonly}
          readonlyClassName="cursor-default opacity-80"
          getChipLabel={(amenity) => translateAmenityStoredLabel(amenity, t)}
          onOptionClick={(amenity) => toggleAmenity(amenity)}
          onChipRemove={(amenity) =>
            onFieldChange(
              "amenities",
              (formData.amenities || []).filter((a) => a !== amenity),
            )
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
          onToggleDropdown={onToggleDropdown}
          readonly={false}
          onOptionClick={(amenity) => togglePropertyAmenity(amenity)}
          onChipRemove={(amenity) =>
            onFieldChange(
              "property_amenities",
              (formData.property_amenities || []).filter((a) => a !== amenity),
            )
          }
        />
      </div>
    </div>
  );
};
