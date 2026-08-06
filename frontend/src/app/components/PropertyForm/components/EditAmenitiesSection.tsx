import React from "react";
import type { Dispatch, SetStateAction } from "react";
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
 * "What's Included" list, moved verbatim.
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
            <div className="relative" data-dropdown>
              <div
                className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white min-h-[40px] flex items-center ${
                  isFieldReadonly
                    ? "cursor-default opacity-80"
                    : "cursor-pointer"
                }`}
                onClick={() => !isFieldReadonly && toggleDropdown("amenities")}
              >
                <div className="flex flex-wrap gap-1 flex-1">
                  {(formData.amenities || []).length > 0 ? (
                    (formData.amenities || []).map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                      >
                        {translateAmenityStoredLabel(amenity, t)}
                        {!isFieldReadonly && (
                          <button
                            type="button"
                            className="ml-1 text-white/70 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({
                                ...formData,
                                amenities: (formData.amenities || []).filter(
                                  (a) => a !== amenity,
                                ),
                              });
                            }}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/50">Select amenities...</span>
                  )}
                </div>
                {!isFieldReadonly && (
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
                )}
              </div>
              {!isFieldReadonly && openDropdown === "amenities" && (
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
                          onClick={() => toggleAmenity(amenity)}
                        >
                          <input
                            type="checkbox"
                            checked={(formData.amenities || []).includes(
                              amenity,
                            )}
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

          {/* What's Included (apartment-level features) */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              What's Included
            </label>
            <div className="relative" data-dropdown>
              <div
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white min-h-[40px] flex items-center cursor-pointer"
                onClick={() => toggleDropdown("property_amenities")}
              >
                <div className="flex flex-wrap gap-1 flex-1">
                  {(formData.property_amenities || []).length > 0 ? (
                    (formData.property_amenities || []).map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                      >
                        {amenity}
                        <button
                          type="button"
                          className="ml-1 text-white/70 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({
                              ...formData,
                              property_amenities: (formData.property_amenities || []).filter(
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
                    <span className="text-white/50">Select features...</span>
                  )}
                </div>
                <svg className="w-5 h-5 text-white/70 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {openDropdown === "property_amenities" && (
                <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {PROPERTY_AMENITIES_BY_CATEGORY.map((category) => (
                    <div key={category.titleKey}>
                      <div className="px-4 py-2 text-xs font-semibold text-white/70 border-b border-white/10 sticky top-0 bg-gray-900/95">
                        {t(category.titleKey)}
                      </div>
                      {category.values.map((amenity) => (
                        <div
                          key={amenity}
                          className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                          onClick={() => togglePropertyAmenity(amenity)}
                        >
                          <input
                            type="checkbox"
                            checked={(formData.property_amenities || []).includes(amenity)}
                            readOnly
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
    </>
  );
};
