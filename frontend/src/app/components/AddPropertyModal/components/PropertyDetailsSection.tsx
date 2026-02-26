import React from "react";
import { FormField, Input, Textarea } from "../../FormField";
import { PropertyFormData } from "../types";

interface PropertyDetailsSectionProps {
  formData: PropertyFormData;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  openDropdown: string | null;
  onFieldChange: (field: string, value: any) => void;
  onFieldBlur: (field: string) => void;
  onToggleDropdown: (dropdown: string) => void;
}

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5] as const;
const BATHROOM_OPTIONS = [1, 2, 3, 4] as const;

export const PropertyDetailsSection: React.FC<PropertyDetailsSectionProps> = ({
  formData,
  errors,
  touched,
  openDropdown,
  onFieldChange,
  onFieldBlur,
  onToggleDropdown,
}) => {
  return (
    <div className="space-y-4">
      <FormField
        label="Description"
        error={errors.descriptions}
        touched={touched.descriptions}
      >
        <Textarea
          value={formData.descriptions}
          onChange={(e) => onFieldChange("descriptions", e.target.value)}
          onBlur={() => onFieldBlur("descriptions")}
          error={touched.descriptions && !!errors.descriptions}
          rows={4}
          placeholder="Describe the property..."
          className="resize-y"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bedrooms dropdown */}
        <FormField
          label="Bedrooms"
          error={errors.bedrooms}
          touched={touched.bedrooms}
        >
          <div className="relative" data-dropdown>
            <div
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
              onClick={() => onToggleDropdown("bedrooms")}
            >
              <span
                className={
                  formData.bedrooms != null ? "text-white" : "text-white/50"
                }
              >
                {formData.bedrooms != null
                  ? formData.bedrooms >= 5
                    ? "5+"
                    : formData.bedrooms
                  : "Select Bedrooms"}
              </span>
              <svg
                className="w-5 h-5 text-white/70"
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
            {openDropdown === "bedrooms" && (
              <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {BEDROOM_OPTIONS.map((value) => (
                  <div
                    key={value}
                    className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                      (value === 5 &&
                        formData.bedrooms != null &&
                        formData.bedrooms >= 5) ||
                      (value < 5 && formData.bedrooms === value)
                        ? "bg-white/10"
                        : ""
                    }`}
                    onClick={() => {
                      onFieldChange("bedrooms", value === 5 ? 5 : value);
                      onToggleDropdown("bedrooms");
                    }}
                  >
                    {value === 5 ? "5+" : value}
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormField>

        {/* Bathrooms dropdown */}
        <FormField
          label="Bathrooms"
          error={errors.bathrooms}
          touched={touched.bathrooms}
        >
          <div className="relative" data-dropdown>
            <div
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
              onClick={() => onToggleDropdown("bathrooms")}
            >
              <span
                className={
                  formData.bathrooms != null ? "text-white" : "text-white/50"
                }
              >
                {formData.bathrooms != null
                  ? formData.bathrooms >= 4
                    ? "4+"
                    : formData.bathrooms
                  : "Select Bathrooms"}
              </span>
              <svg
                className="w-5 h-5 text-white/70"
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
            {openDropdown === "bathrooms" && (
              <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {BATHROOM_OPTIONS.map((value) => (
                  <div
                    key={value}
                    className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                      (value === 4 &&
                        formData.bathrooms != null &&
                        formData.bathrooms >= 4) ||
                      (value < 4 && formData.bathrooms === value)
                        ? "bg-white/10"
                        : ""
                    }`}
                    onClick={() => {
                      onFieldChange("bathrooms", value === 4 ? 4 : value);
                      onToggleDropdown("bathrooms");
                    }}
                  >
                    {value === 4 ? "4+" : value}
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormField>

        <FormField label="Floor" error={errors.floor} touched={touched.floor}>
          <Input
            type="number"
            value={formData.floor ?? ""}
            onChange={(e) =>
              onFieldChange(
                "floor",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            onBlur={() => onFieldBlur("floor")}
            error={touched.floor && !!errors.floor}
            min={0}
          />
        </FormField>

        <FormField
          label="Square Meters"
          error={errors.square_meters}
          touched={touched.square_meters}
        >
          <Input
            type="number"
            value={formData.square_meters ?? ""}
            onChange={(e) =>
              onFieldChange(
                "square_meters",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            onBlur={() => onFieldBlur("square_meters")}
            error={touched.square_meters && !!errors.square_meters}
            min={0}
            step="0.1"
          />
        </FormField>
      </div>

      {/* Checkboxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.outdoor_space}
            onChange={(e) =>
              onFieldChange("outdoor_space", e.target.checked)
            }
            className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
          />
          <span className="text-sm text-white/90">Outdoor Space</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.balcony}
            onChange={(e) => onFieldChange("balcony", e.target.checked)}
            className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
          />
          <span className="text-sm text-white/90">Balcony</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.terrace}
            onChange={(e) => onFieldChange("terrace", e.target.checked)}
            className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
          />
          <span className="text-sm text-white/90">Terrace</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.luxury}
            onChange={(e) => onFieldChange("luxury", e.target.checked)}
            className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
          />
          <span className="text-sm text-white/90">Luxury</span>
        </label>
      </div>
    </div>
  );
};
