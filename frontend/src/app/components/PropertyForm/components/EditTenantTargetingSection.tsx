import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { MultiSelectDropdown } from "@/app/components/form/MultiSelectDropdown";
import type { EditPropertyFormData } from "../types";

interface EditTenantTargetingSectionProps {
  formData: EditPropertyFormData;
  setFormData: Dispatch<SetStateAction<EditPropertyFormData>>;
  openDropdown: string | null;
  toggleDropdown: (name: string) => void;
  isFieldReadonly: boolean;
  tenantTypeOptions: { value: string; label: string }[];
  occupationOptions: { value: string; label: string }[];
  familyStatusOptions: { value: string; label: string }[];
  childrenOptions: { value: string; label: string }[];
  hasNoChildrenSelected: boolean;
}

/**
 * Tenant types, occupation, family status and children — the readonly-aware
 * multi-selects on the shared primitive. A fragment inside the
 * orchestrator's grid. Tenant types keeps its focus-ring classes, the other
 * three never had them — as in the monolith.
 */
export const EditTenantTargetingSection: React.FC<
  EditTenantTargetingSectionProps
> = ({
  formData,
  setFormData,
  openDropdown,
  toggleDropdown,
  isFieldReadonly,
  tenantTypeOptions,
  occupationOptions,
  familyStatusOptions,
  childrenOptions,
  hasNoChildrenSelected,
}) => {
  return (
    <>
      {/* Tenant Type multi-select dropdown */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Tenant Types{" "}
          {isFieldReadonly && (
            <span className="text-white/50 text-xs">(from building)</span>
          )}
        </label>
        <MultiSelectDropdown
          name="tenant_types"
          values={formData.tenant_types}
          options={tenantTypeOptions}
          placeholder="Select types..."
          openDropdown={openDropdown}
          onToggleDropdown={toggleDropdown}
          readonly={isFieldReadonly}
          onOptionClick={(value) => {
            const newTenantTypes = formData.tenant_types.includes(value)
              ? formData.tenant_types.filter((t) => t !== value)
              : [...formData.tenant_types, value];
            setFormData({
              ...formData,
              tenant_types: newTenantTypes,
            });
          }}
          onChipRemove={(value) =>
            setFormData({
              ...formData,
              tenant_types: formData.tenant_types.filter((t) => t !== value),
            })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Occupation{" "}
          {isFieldReadonly && (
            <span className="text-white/50 text-xs">(from building)</span>
          )}
        </label>
        <MultiSelectDropdown
          name="occupation"
          values={formData.occupation || []}
          options={occupationOptions}
          placeholder="Select occupations..."
          openDropdown={openDropdown}
          onToggleDropdown={toggleDropdown}
          focusRing={false}
          readonly={isFieldReadonly}
          onOptionClick={(value) => {
            const current = formData.occupation || [];
            const next = current.includes(value)
              ? current.filter((v) => v !== value)
              : [...current, value];
            setFormData({ ...formData, occupation: next });
          }}
          onChipRemove={(value) =>
            setFormData({
              ...formData,
              occupation: (formData.occupation || []).filter(
                (v) => v !== value,
              ),
            })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Family Status{" "}
          {isFieldReadonly && (
            <span className="text-white/50 text-xs">(from building)</span>
          )}
        </label>
        <MultiSelectDropdown
          name="family_status"
          values={formData.family_status || []}
          options={familyStatusOptions}
          placeholder="Select family statuses..."
          openDropdown={openDropdown}
          onToggleDropdown={toggleDropdown}
          focusRing={false}
          readonly={isFieldReadonly}
          onOptionClick={(value) => {
            const current = formData.family_status || [];
            const next = current.includes(value)
              ? current.filter((v) => v !== value)
              : [...current, value];
            setFormData({ ...formData, family_status: next });
          }}
          onChipRemove={(value) =>
            setFormData({
              ...formData,
              family_status: (formData.family_status || []).filter(
                (v) => v !== value,
              ),
            })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Children{" "}
          {isFieldReadonly && (
            <span className="text-white/50 text-xs">(from building)</span>
          )}
        </label>
        <MultiSelectDropdown
          name="children"
          values={formData.children || []}
          options={childrenOptions.map((option) => ({
            ...option,
            disabled: hasNoChildrenSelected && option.value !== "no",
          }))}
          placeholder="Select children statuses..."
          openDropdown={openDropdown}
          onToggleDropdown={toggleDropdown}
          focusRing={false}
          readonly={isFieldReadonly}
          onOptionClick={(value) => {
            const current = formData.children || [];
            const next = current.includes(value)
              ? current.filter((v) => v !== value)
              : value === "no"
                ? ["no"]
                : [...current.filter((v) => v !== "no"), value];
            setFormData({ ...formData, children: next });
          }}
          onChipRemove={(value) =>
            setFormData({
              ...formData,
              children: (formData.children || []).filter((v) => v !== value),
            })
          }
        />
      </div>
    </>
  );
};
