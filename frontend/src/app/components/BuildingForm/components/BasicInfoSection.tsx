import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { FormField, Input, Textarea } from "@/app/components/FormField";
import { TYPE_OF_UNIT_OPTIONS } from "@/constants/admin-form-options";
import type { BuildingFormData } from "../types";

interface BasicInfoSectionProps {
  formData: BuildingFormData;
  setFormData: Dispatch<SetStateAction<BuildingFormData>>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  openDropdown: string | null;
  onFieldChange: (field: string, value: any) => void;
  onFieldBlur: (field: string) => void;
  onToggleDropdown: (name: string) => void;
}

/**
 * Name, address, description, number of units and the type-of-unit
 * multi-select. Rendered as a fragment inside the section grid that
 * `index.tsx` owns, so the DOM stays exactly as it was in the monolith.
 */
export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  setFormData,
  errors,
  touched,
  openDropdown,
  onFieldChange,
  onFieldBlur,
  onToggleDropdown,
}) => {
  return (
    <>
      <FormField
        label="Name"
        required
        error={errors.name}
        touched={touched.name}
      >
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          onBlur={() => onFieldBlur("name")}
          error={touched.name && !!errors.name}
          placeholder="e.g. The Grand Tower"
        />
      </FormField>

      <FormField
        label="Address"
        error={errors.address}
        touched={touched.address}
      >
        <Input
          type="text"
          value={formData.address}
          onChange={(e) => onFieldChange("address", e.target.value)}
          onBlur={() => onFieldBlur("address")}
          error={touched.address && !!errors.address}
          placeholder="e.g. 123 Main Street, London"
        />
      </FormField>

      <FormField label="Description" className="md:col-span-2">
        <Textarea
          value={formData.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          placeholder="Describe the building, its location, and key highlights"
          rows={3}
        />
      </FormField>

      <FormField
        label="Number of Units"
        error={errors.number_of_units}
        touched={touched.number_of_units}
      >
        <Input
          type="number"
          value={formData.number_of_units || ""}
          onChange={(e) =>
            onFieldChange(
              "number_of_units",
              e.target.value === "" ? null : parseInt(e.target.value),
            )
          }
          onBlur={() => onFieldBlur("number_of_units")}
          error={touched.number_of_units && !!errors.number_of_units}
          min="1"
          placeholder="e.g. 50"
          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
        />
      </FormField>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Type of Unit
        </label>
        <div className="relative" data-dropdown>
          <div
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center"
            onClick={() => onToggleDropdown("type_of_unit")}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {formData.type_of_unit.length > 0 ? (
                formData.type_of_unit.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                  >
                    {value}
                    <button
                      type="button"
                      className="ml-1 text-white/70 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({
                          ...formData,
                          type_of_unit: formData.type_of_unit.filter(
                            (t) => t !== value,
                          ),
                        });
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-white/50">Select types...</span>
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
          {openDropdown === "type_of_unit" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {TYPE_OF_UNIT_OPTIONS.map((option) => (
                <div
                  key={option}
                  className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                  onClick={() => {
                    const newTypeOfUnit =
                      formData.type_of_unit.includes(option)
                        ? formData.type_of_unit.filter(
                            (t) => t !== option,
                          )
                        : [
                            ...new Set([
                              ...formData.type_of_unit,
                              option,
                            ]),
                          ];
                    setFormData({
                      ...formData,
                      type_of_unit: newTypeOfUnit,
                    });
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.type_of_unit.includes(option)}
                    readOnly
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{option}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
