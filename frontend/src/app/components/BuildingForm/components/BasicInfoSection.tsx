import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { FormField, Input, Textarea } from "@/app/components/FormField";
import { MultiSelectDropdown } from "@/app/components/form/MultiSelectDropdown";
import { TYPE_OF_UNIT_OPTIONS } from "@/constants/admin-form-options";
import type { BuildingFormData } from "../types";

const TYPE_OF_UNIT_MS_OPTIONS = TYPE_OF_UNIT_OPTIONS.map((option) => ({
  value: option,
  label: option,
}));

interface BasicInfoSectionProps {
  formData: BuildingFormData;
  setFormData: Dispatch<SetStateAction<BuildingFormData>>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  openDropdown: string | null;
  onFieldChange: (field: string, value: any) => void;
  onFieldBlur: (field: string) => void;
  onToggleDropdown: (name: string) => void;
  mode: "create" | "edit";
}

/**
 * Name, address, description, number of units and the type-of-unit
 * multi-select. Rendered as a fragment inside the section grid that
 * `index.tsx` owns, so the DOM stays exactly as it was in the monolith.
 *
 * The two monoliths disagreed on these four fields and the difference is
 * kept on purpose: create renders `FormField`/`Input` with placeholders and
 * validation wiring, edit renders the raw inputs with testids and no
 * validation at all.
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
  mode,
}) => {
  return (
    <>
      {mode === "edit" ? (
        <>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              data-testid="building-edit-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Address
            </label>
            <input
              type="text"
              data-testid="building-edit-address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/90 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Describe the building, its location, and key highlights"
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Number of Units
            </label>
            <input
              type="number"
              value={formData.number_of_units || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  number_of_units:
                    e.target.value === "" ? null : parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              min="1"
            />
          </div>
        </>
      ) : (
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
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Type of Unit
        </label>
        <MultiSelectDropdown
          name="type_of_unit"
          values={formData.type_of_unit}
          options={TYPE_OF_UNIT_MS_OPTIONS}
          placeholder="Select types..."
          openDropdown={openDropdown}
          onToggleDropdown={onToggleDropdown}
          onOptionClick={(option) => {
            const newTypeOfUnit = formData.type_of_unit.includes(option)
              ? formData.type_of_unit.filter((t) => t !== option)
              : [...new Set([...formData.type_of_unit, option])];
            setFormData({
              ...formData,
              type_of_unit: newTypeOfUnit,
            });
          }}
          onChipRemove={(value) =>
            setFormData({
              ...formData,
              type_of_unit: formData.type_of_unit.filter((t) => t !== value),
            })
          }
        />
      </div>
    </>
  );
};
