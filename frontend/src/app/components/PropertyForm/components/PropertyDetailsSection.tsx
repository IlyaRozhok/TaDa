import React from "react";
import { FormField, Input, Textarea } from "../../FormField";
import { SingleSelectDropdown } from "@/app/components/form/SingleSelectDropdown";
import { PropertyFormData } from "../types";
import { sqFtToSqM, formatSqMForForm } from "@/shared/lib/area";

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
          <SingleSelectDropdown
            name="bedrooms"
            openDropdown={openDropdown}
            onToggleDropdown={onToggleDropdown}
            displayClassName={
              formData.bedrooms != null ? "text-white" : "text-white/50"
            }
            display={
              formData.bedrooms != null
                ? formData.bedrooms >= 5
                  ? "5+"
                  : formData.bedrooms
                : "Select Bedrooms"
            }
            options={BEDROOM_OPTIONS.map((value) => ({
              value: String(value),
              content: value === 5 ? "5+" : value,
              selected:
                (value === 5 &&
                  formData.bedrooms != null &&
                  formData.bedrooms >= 5) ||
                (value < 5 && formData.bedrooms === value),
            }))}
            onSelect={(value) => {
              onFieldChange("bedrooms", Number(value));
              onToggleDropdown("bedrooms");
            }}
          />
        </FormField>

        {/* Bathrooms dropdown */}
        <FormField
          label="Bathrooms"
          error={errors.bathrooms}
          touched={touched.bathrooms}
        >
          <SingleSelectDropdown
            name="bathrooms"
            openDropdown={openDropdown}
            onToggleDropdown={onToggleDropdown}
            displayClassName={
              formData.bathrooms != null ? "text-white" : "text-white/50"
            }
            display={
              formData.bathrooms != null
                ? formData.bathrooms >= 4
                  ? "4+"
                  : formData.bathrooms
                : "Select Bathrooms"
            }
            options={BATHROOM_OPTIONS.map((value) => ({
              value: String(value),
              content: value === 4 ? "4+" : value,
              selected:
                (value === 4 &&
                  formData.bathrooms != null &&
                  formData.bathrooms >= 4) ||
                (value < 4 && formData.bathrooms === value),
            }))}
            onSelect={(value) => {
              onFieldChange("bathrooms", Number(value));
              onToggleDropdown("bathrooms");
            }}
          />
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
          label="Square Feet"
          error={errors.square_meters}
          touched={touched.square_meters}
        >
          <Input
            type="number"
            value={formData.square_feet ?? ""}
            onChange={(e) => {
              const raw = e.target.value === "" ? null : Number(e.target.value);
              const sqFt = raw != null && !isNaN(raw) ? raw : null;
              onFieldChange("square_feet", sqFt);
              onFieldChange(
                "square_meters",
                sqFt == null ? null : sqFtToSqM(sqFt),
              );
            }}
            onBlur={() => onFieldBlur("square_meters")}
            error={touched.square_meters && !!errors.square_meters}
            min={0}
            step="0.1"
          />
        </FormField>

        <FormField label="Square Meters">
          <Input
            type="text"
            value={formatSqMForForm(formData.square_meters)}
            readOnly
            tabIndex={-1}
            placeholder="—"
          />
        </FormField>
      </div>

      {/* Checkboxes */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
      </div>
    </div>
  );
};
