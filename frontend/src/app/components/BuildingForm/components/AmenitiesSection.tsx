import React from "react";
import type { Dispatch, SetStateAction } from "react";
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

  return (
    <div>
      <label className="block text-sm font-medium text-white/90 mb-2">
        Amenities
      </label>
      <div className="relative" data-dropdown>
        <div
          className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center"
          onClick={() => onToggleDropdown("amenities")}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {formData.amenities.length > 0 ? (
              formData.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                >
                  {translateAmenityStoredLabel(amenity, t)}
                  <button
                    type="button"
                    className="ml-1 text-white/70 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({
                        ...formData,
                        amenities: formData.amenities.filter(
                          (a) => a !== amenity,
                        ),
                      });
                    }}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-white/50">Select amenities...</span>
            )}
          </div>
          <svg
            className="w-5 h-5 text-white/70 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {openDropdown === "amenities" && (
          <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {AMENITIES_BY_CATEGORY.map((category) => (
              <div key={category.title}>
                <div className="px-4 py-2 text-xs font-semibold text-white/70 border-b border-white/10 sticky top-0 bg-gray-900/95">
                  {category.title}
                </div>
                {category.values.map((amenity) => (
                  <div
                    key={amenity}
                    className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                    onClick={() => {
                      const newAmenities = formData.amenities.includes(
                        amenity,
                      )
                        ? formData.amenities.filter((a) => a !== amenity)
                        : [...formData.amenities, amenity];
                      setFormData({
                        ...formData,
                        amenities: newAmenities,
                      });
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      readOnly
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{translateAmenityStoredLabel(amenity, t)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
