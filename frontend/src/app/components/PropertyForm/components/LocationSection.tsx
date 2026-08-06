import React from "react";
import { FormField, Input, Select } from "../../FormField";
import { MultiSelectDropdown } from "@/app/components/form/MultiSelectDropdown";
import { PropertyFormData } from "../types";
import { useLocalizedFormOptions } from "../../../../shared/hooks/useLocalizedFormOptions";
import { useTranslation } from "../../../hooks/useTranslation";
import { wizardKeys } from "../../../lib/translationsKeys/wizardTranslationKeys";

const OCCUPATION_VALUES = [
  "student",
  "young-professional",
  "freelancer-remote-worker",
  "business-owner",
  "family-professional",
  "other",
];

const FAMILY_STATUS_VALUES = [
  "just-me",
  "couple",
  "couple-with-children",
  "single-parent",
  "friends-flatmates",
];

const CHILDREN_VALUES = [
  "no",
  "yes-1-child",
  "yes-2-children",
  "yes-3-plus-children",
];

interface LocationSectionProps {
  formData: PropertyFormData;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  openDropdown: string | null;
  onFieldChange: (field: string, value: any) => void;
  onFieldBlur: (field: string) => void;
  onToggleDropdown: (dropdown: string) => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  formData,
  errors,
  touched,
  openDropdown,
  onFieldChange,
  onFieldBlur,
  onToggleDropdown,
}) => {
  const { t } = useTranslation();
  const {
    propertyTypeOptions,
    furnishingOptions,
    billsOptions,
    tenantTypeOptions,
    durationOptions,
  } = useLocalizedFormOptions();

  const isReadonly =
    formData.building_type !== "private_landlord" && !!formData.building_id;
  const occupationOptions = OCCUPATION_VALUES.map((value, i) => ({
    value,
    label: t(wizardKeys.step9.occupationOptions[i]),
  }));
  const familyStatusOptions = FAMILY_STATUS_VALUES.map((value, i) => ({
    value,
    label: t(wizardKeys.step9.familyStatusOptions[i]),
  }));
  const childrenOptions = CHILDREN_VALUES.map((value, i) => ({
    value,
    label: t(wizardKeys.step9.childrenStatusOptions[i]),
  }));
  const hasNoChildrenSelected = (formData.children || []).includes("no");

  return (
    <div className="space-y-4">
      <FormField
        label="Address"
        required
        error={errors.address}
        touched={touched.address}
      >
        <Input
          type="text"
          value={formData.address}
          onChange={(e) => onFieldChange("address", e.target.value)}
          onBlur={() => onFieldBlur("address")}
          error={touched.address && !!errors.address}
          placeholder="Full property address"
          readOnly={isReadonly}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Price (£ PCM)"
          error={errors.price}
          touched={touched.price}
        >
          <Input
            type="number"
            value={formData.price ?? ""}
            onChange={(e) =>
              onFieldChange(
                "price",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            onBlur={() => onFieldBlur("price")}
            error={touched.price && !!errors.price}
            placeholder="2000"
            min={0}
          />
        </FormField>

        <FormField
          label="Deposit (£)"
          error={errors.deposit}
          touched={touched.deposit}
        >
          <Input
            type="number"
            value={formData.deposit ?? ""}
            onChange={(e) =>
              onFieldChange(
                "deposit",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            onBlur={() => onFieldBlur("deposit")}
            error={touched.deposit && !!errors.deposit}
            placeholder="2000"
            min={0}
          />
        </FormField>

        <FormField
          label="Available From"
          error={errors.available_from}
          touched={touched.available_from}
        >
          <Input
            type="date"
            value={formData.available_from ?? ""}
            onChange={(e) =>
              onFieldChange("available_from", e.target.value || null)
            }
            onBlur={() => onFieldBlur("available_from")}
            error={touched.available_from && !!errors.available_from}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Property Type"
          error={errors.property_type}
          touched={touched.property_type}
        >
          <Select
            value={formData.property_type}
            onChange={(e) => onFieldChange("property_type", e.target.value)}
            onBlur={() => onFieldBlur("property_type")}
            error={touched.property_type && !!errors.property_type}
            options={propertyTypeOptions}
            placeholder="Select type"
          />
        </FormField>

        <FormField
          label="Furnishing"
          error={errors.furnishing}
          touched={touched.furnishing}
        >
          <Select
            value={formData.furnishing}
            onChange={(e) => onFieldChange("furnishing", e.target.value)}
            onBlur={() => onFieldBlur("furnishing")}
            error={touched.furnishing && !!errors.furnishing}
            options={furnishingOptions}
            placeholder="Select furnishing"
          />
        </FormField>

        <FormField label="Bills" error={errors.bills} touched={touched.bills}>
          <Select
            value={formData.bills}
            onChange={(e) => onFieldChange("bills", e.target.value)}
            onBlur={() => onFieldBlur("bills")}
            error={touched.bills && !!errors.bills}
            options={billsOptions}
            placeholder="Select bills"
          />
        </FormField>
      </div>

      {/* Tenant Types (multi-select) */}
      <FormField
        label="Tenant Types"
        error={errors.tenant_types}
        touched={touched.tenant_types}
      >
        <MultiSelectDropdown
          name="tenant_types"
          values={formData.tenant_types || []}
          options={tenantTypeOptions}
          placeholder="Select types..."
          openDropdown={openDropdown}
          onToggleDropdown={onToggleDropdown}
          readonly={isReadonly}
          onOptionClick={(value) => {
            const newTenantTypes = formData.tenant_types.includes(value)
              ? formData.tenant_types.filter((t) => t !== value)
              : [...formData.tenant_types, value];
            onFieldChange("tenant_types", newTenantTypes);
          }}
          onChipRemove={(value) =>
            onFieldChange(
              "tenant_types",
              formData.tenant_types.filter((t) => t !== value),
            )
          }
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Occupation">
          <MultiSelectDropdown
            name="occupation"
            values={formData.occupation || []}
            options={occupationOptions}
            placeholder="Select occupations..."
            openDropdown={openDropdown}
            onToggleDropdown={onToggleDropdown}
            focusRing={false}
            readonly={isReadonly}
            onOptionClick={(value) => {
              const current = formData.occupation || [];
              const next = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];
              onFieldChange("occupation", next);
            }}
            onChipRemove={(value) =>
              onFieldChange(
                "occupation",
                (formData.occupation || []).filter((v) => v !== value),
              )
            }
          />
        </FormField>

        <FormField label="Family Status">
          <MultiSelectDropdown
            name="family_status"
            values={formData.family_status || []}
            options={familyStatusOptions}
            placeholder="Select family statuses..."
            openDropdown={openDropdown}
            onToggleDropdown={onToggleDropdown}
            focusRing={false}
            readonly={isReadonly}
            onOptionClick={(value) => {
              const current = formData.family_status || [];
              const next = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];
              onFieldChange("family_status", next);
            }}
            onChipRemove={(value) =>
              onFieldChange(
                "family_status",
                (formData.family_status || []).filter((v) => v !== value),
              )
            }
          />
        </FormField>

        <FormField label="Children">
          <MultiSelectDropdown
            name="children"
            values={formData.children || []}
            options={childrenOptions.map((option) => ({
              ...option,
              disabled: hasNoChildrenSelected && option.value !== "no",
            }))}
            placeholder="Select children statuses..."
            openDropdown={openDropdown}
            onToggleDropdown={onToggleDropdown}
            focusRing={false}
            readonly={isReadonly}
            onOptionClick={(value) => {
              const current = formData.children || [];
              const next = current.includes(value)
                ? current.filter((v) => v !== value)
                : value === "no"
                  ? ["no"]
                  : [...current.filter((v) => v !== "no"), value];
              onFieldChange("children", next);
            }}
            onChipRemove={(value) =>
              onFieldChange(
                "children",
                (formData.children || []).filter((v) => v !== value),
              )
            }
          />
        </FormField>
      </div>

      {/* Let Duration (multi-select) */}
      <FormField
        label="Let Duration"
        error={errors.let_duration}
        touched={touched.let_duration}
      >
        <MultiSelectDropdown
          name="let_duration"
          values={formData.let_duration || []}
          options={durationOptions}
          placeholder="Select duration..."
          openDropdown={openDropdown}
          onToggleDropdown={onToggleDropdown}
          readonly={false}
          onOptionClick={(value) => {
            const current = formData.let_duration || [];
            const newDuration = current.includes(value)
              ? current.filter((d) => d !== value)
              : [...current, value];
            onFieldChange("let_duration", newDuration);
          }}
          onChipRemove={(value) =>
            onFieldChange(
              "let_duration",
              formData.let_duration.filter((d) => d !== value),
            )
          }
        />
      </FormField>
    </div>
  );
};
