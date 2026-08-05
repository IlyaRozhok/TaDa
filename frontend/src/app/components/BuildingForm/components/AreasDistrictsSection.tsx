import React from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  AREA_OPTIONS,
  LONDON_DISTRICTS,
} from "@/constants/admin-form-options";
import type { BuildingFormData } from "../types";

const AREAS = AREA_OPTIONS;

interface AreasDistrictsSectionProps {
  formData: BuildingFormData;
  setFormData: Dispatch<SetStateAction<BuildingFormData>>;
  openDropdown: string | null;
  onToggleDropdown: (name: string) => void;
}

/**
 * Areas and Districts multi-selects. A fragment of two sibling blocks, so
 * the form's flat child order stays exactly as it was in the monolith.
 */
export const AreasDistrictsSection: React.FC<AreasDistrictsSectionProps> = ({
  formData,
  setFormData,
  openDropdown,
  onToggleDropdown,
}) => {
  return (
    <>
      {/* Areas */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Areas
        </label>
        <div className="relative" data-dropdown>
          <div
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center"
            onClick={() => onToggleDropdown("areas")}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {formData.areas.length > 0 ? (
                formData.areas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                  >
                    {area}
                    <button
                      type="button"
                      className="ml-1 text-white/70 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({
                          ...formData,
                          areas: formData.areas.filter((a) => a !== area),
                        });
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-white/50">Select areas...</span>
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
          {openDropdown === "areas" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {AREAS.map((area) => (
                <div
                  key={area}
                  className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                  onClick={() => {
                    const newAreas = formData.areas.includes(area)
                      ? formData.areas.filter((a) => a !== area)
                      : [...formData.areas, area];
                    setFormData({
                      ...formData,
                      areas: newAreas,
                    });
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.areas.includes(area)}
                    readOnly
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Districts */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Districts
        </label>
        <div className="relative" data-dropdown>
          <div
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center"
            onClick={() => onToggleDropdown("districts")}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {formData.districts.length > 0 ? (
                formData.districts.map((district) => (
                  <span
                    key={district}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                  >
                    {district}
                    <button
                      type="button"
                      className="ml-1 text-white/70 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({
                          ...formData,
                          districts: formData.districts.filter(
                            (d) => d !== district,
                          ),
                        });
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-white/50">Select districts...</span>
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
          {openDropdown === "districts" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {LONDON_DISTRICTS.map((district) => (
                <div
                  key={district}
                  className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                  onClick={() => {
                    const newDistricts = formData.districts.includes(
                      district,
                    )
                      ? formData.districts.filter((d) => d !== district)
                      : [...formData.districts, district];
                    setFormData({
                      ...formData,
                      districts: newDistricts,
                    });
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.districts.includes(district)}
                    readOnly
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{district}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
