import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { MultiSelectDropdown } from "@/app/components/form/MultiSelectDropdown";
import { SingleSelectDropdown } from "@/app/components/form/SingleSelectDropdown";
import type { EditPropertyFormData } from "../types";
import { Bills, Furnishing } from "@/app/types/property";
import { sqFtToSqM, formatSqMForForm } from "@/shared/lib/area";

interface EditPropertyDetailsSectionProps {
  formData: EditPropertyFormData;
  setFormData: Dispatch<SetStateAction<EditPropertyFormData>>;
  openDropdown: string | null;
  setOpenDropdown: Dispatch<SetStateAction<string | null>>;
  toggleDropdown: (name: string) => void;
  furnishingOptions: { value: string; label: string }[];
  durationOptions: { value: string; label: string }[];
}

/**
 * Furnishing, let duration, bills, bedrooms, bathrooms, floor and the
 * square-feet input paired with the derived read-only square-meters field.
 * A fragment inside the orchestrator's grid, on the shared primitives.
 */
export const EditPropertyDetailsSection: React.FC<
  EditPropertyDetailsSectionProps
> = ({
  formData,
  setFormData,
  openDropdown,
  setOpenDropdown,
  toggleDropdown,
  furnishingOptions,
  durationOptions,
}) => {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Furnishing
        </label>
        <SingleSelectDropdown
          name="furnishing"
          openDropdown={openDropdown}
          onToggleDropdown={toggleDropdown}
          displayClassName={formData.furnishing ? "text-white" : "text-white/50"}
          display={
            formData.furnishing
              ? (furnishingOptions.find(
                  (o) => o.value === formData.furnishing,
                )?.label ??
                formData.furnishing
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase()))
              : "Select Type"
          }
          options={furnishingOptions.map((option) => ({
            value: option.value,
            content: option.label,
            selected: formData.furnishing === option.value,
          }))}
          onSelect={(value) => {
            setFormData({
              ...formData,
              furnishing: value as Furnishing,
            });
            setOpenDropdown(null);
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Let Duration
        </label>
        <MultiSelectDropdown
          name="let_duration"
          values={formData.let_duration || []}
          options={durationOptions}
          placeholder="Select duration..."
          openDropdown={openDropdown}
          onToggleDropdown={toggleDropdown}
          onOptionClick={(value) => {
            const current = formData.let_duration || [];
            const newDuration = current.includes(value)
              ? current.filter((d) => d !== value)
              : [...current, value];
            setFormData({
              ...formData,
              let_duration: newDuration,
            });
          }}
          onChipRemove={(value) =>
            setFormData({
              ...formData,
              let_duration: (formData.let_duration || []).filter(
                (d) => d !== value,
              ),
            })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Bills
        </label>
        <SingleSelectDropdown
          name="bills"
          openDropdown={openDropdown}
          onToggleDropdown={toggleDropdown}
          displayClassName={formData.bills ? "text-white" : "text-white/50"}
          display={
            formData.bills
              ? formData.bills.charAt(0).toUpperCase() +
                formData.bills.slice(1)
              : "Select Option"
          }
          options={Object.values(Bills).map((type) => ({
            value: type,
            content: type.charAt(0).toUpperCase() + type.slice(1),
            selected: formData.bills === type,
          }))}
          onSelect={(value) => {
            setFormData({ ...formData, bills: value as Bills });
            setOpenDropdown(null);
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Bedrooms
        </label>
        <SingleSelectDropdown
          name="bedrooms"
          openDropdown={openDropdown}
          onToggleDropdown={toggleDropdown}
          displayClassName={formData.bedrooms ? "text-white" : "text-white/50"}
          display={
            formData.bedrooms
              ? formData.bedrooms >= 5
                ? "5+"
                : formData.bedrooms
              : "Select Bedrooms"
          }
          options={[1, 2, 3, 4, 5].map((value) => ({
            value: String(value),
            content: value === 5 ? "5+" : value,
            selected:
              (value === 5 &&
                !!formData.bedrooms &&
                formData.bedrooms >= 5) ||
              (value < 5 && formData.bedrooms === value),
          }))}
          onSelect={(value) => {
            setFormData({
              ...formData,
              bedrooms: Number(value),
            });
            setOpenDropdown(null);
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Bathrooms
        </label>
        <SingleSelectDropdown
          name="bathrooms"
          openDropdown={openDropdown}
          onToggleDropdown={toggleDropdown}
          displayClassName={formData.bathrooms ? "text-white" : "text-white/50"}
          display={
            formData.bathrooms
              ? formData.bathrooms >= 4
                ? "4+"
                : formData.bathrooms
              : "Select Bathrooms"
          }
          options={[1, 2, 3, 4].map((value) => ({
            value: String(value),
            content: value === 4 ? "4+" : value,
            selected:
              (value === 4 &&
                !!formData.bathrooms &&
                formData.bathrooms >= 4) ||
              (value < 4 && formData.bathrooms === value),
          }))}
          onSelect={(value) => {
            setFormData({
              ...formData,
              bathrooms: Number(value),
            });
            setOpenDropdown(null);
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Floor
        </label>
        <input
          type="number"
          value={formData.floor || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              floor: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
          min="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Square Feet
        </label>
        <input
          type="number"
          value={formData.square_feet ?? ""}
          onChange={(e) => {
            const raw = e.target.value === "" ? null : Number(e.target.value);
            const sqFt = raw != null && !isNaN(raw) ? raw : null;
            setFormData({
              ...formData,
              square_feet: sqFt,
              square_meters: sqFt == null ? null : sqFtToSqM(sqFt),
            });
          }}
          className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
          min="0"
          step="0.1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Square Meters
        </label>
        <input
          type="text"
          value={formatSqMForForm(formData.square_meters)}
          readOnly
          tabIndex={-1}
          placeholder="—"
          className="w-full px-4 py-2 bg-white/5 backdrop-blur-[5px] border border-white/20 rounded-lg text-white/70 placeholder-white/50 cursor-not-allowed"
        />
      </div>
    </>
  );
};
