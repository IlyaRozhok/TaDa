import React, { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { MultiSelectDropdown } from "@/app/components/form/MultiSelectDropdown";
import { SingleSelectDropdown } from "@/app/components/form/SingleSelectDropdown";
import { useLocalizedFormOptions } from "@/shared/hooks/useLocalizedFormOptions";
import { useTranslation } from "@/app/hooks/useTranslation";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import type { BuildingFormData, Operator } from "../types";

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

const NO_CHILDREN_VALUE = "no";

const operatorDisplayName = (op: Operator | undefined) =>
  op?.operatorProfile?.company_name ||
  op?.operatorProfile?.full_name ||
  op?.full_name ||
  op?.email;

interface TenantTargetingSectionProps {
  formData: BuildingFormData;
  setFormData: Dispatch<SetStateAction<BuildingFormData>>;
  openDropdown: string | null;
  setOpenDropdown: Dispatch<SetStateAction<string | null>>;
  onToggleDropdown: (name: string) => void;
  operators: Operator[];
  operatorsLoading: boolean;
}

/**
 * Tenant types, occupation, family status, children and the operator picker.
 * Rendered as a fragment inside the section grid that `index.tsx` owns, in
 * the same item order as the monolith, so the grid flow does not change.
 *
 * The occupation/family/children toggles never carried the focus-ring
 * classes while tenant types did — `focusRing` keeps that as it was.
 */
export const TenantTargetingSection: React.FC<TenantTargetingSectionProps> = ({
  formData,
  setFormData,
  openDropdown,
  setOpenDropdown,
  onToggleDropdown,
  operators,
  operatorsLoading,
}) => {
  const { t } = useTranslation();
  const { tenantTypeOptions } = useLocalizedFormOptions();
  const occupationOptions = useMemo(
    () =>
      OCCUPATION_VALUES.map((value, i) => ({
        value,
        label: t(wizardKeys.step9.occupationOptions[i]),
      })),
    [t],
  );
  const familyStatusOptions = useMemo(
    () =>
      FAMILY_STATUS_VALUES.map((value, i) => ({
        value,
        label: t(wizardKeys.step9.familyStatusOptions[i]),
      })),
    [t],
  );
  const childrenOptions = useMemo(
    () =>
      CHILDREN_VALUES.map((value, i) => ({
        value,
        label: t(wizardKeys.step9.childrenStatusOptions[i]),
      })),
    [t],
  );
  const hasNoChildrenSelected = formData.children.includes(NO_CHILDREN_VALUE);

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Tenant Types
        </label>
        <MultiSelectDropdown
          name="tenant_type"
          values={formData.tenant_type}
          options={tenantTypeOptions}
          placeholder="Select types..."
          openDropdown={openDropdown}
          onToggleDropdown={onToggleDropdown}
          onOptionClick={(value) => {
            const newTenantType = formData.tenant_type.includes(value)
              ? formData.tenant_type.filter((t) => t !== value)
              : [...formData.tenant_type, value];
            setFormData({
              ...formData,
              tenant_type: newTenantType,
            });
          }}
          onChipRemove={(value) =>
            setFormData({
              ...formData,
              tenant_type: formData.tenant_type.filter((t) => t !== value),
            })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Occupation
        </label>
        <MultiSelectDropdown
          name="occupation"
          values={formData.occupation}
          options={occupationOptions}
          placeholder="Select occupations..."
          openDropdown={openDropdown}
          onToggleDropdown={onToggleDropdown}
          focusRing={false}
          onOptionClick={(value) => {
            const next = formData.occupation.includes(value)
              ? formData.occupation.filter((v) => v !== value)
              : [...formData.occupation, value];
            setFormData({ ...formData, occupation: next });
          }}
          onChipRemove={(value) =>
            setFormData({
              ...formData,
              occupation: formData.occupation.filter((v) => v !== value),
            })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Family Status
        </label>
        <MultiSelectDropdown
          name="family_status"
          values={formData.family_status}
          options={familyStatusOptions}
          placeholder="Select family statuses..."
          openDropdown={openDropdown}
          onToggleDropdown={onToggleDropdown}
          focusRing={false}
          onOptionClick={(value) => {
            const next = formData.family_status.includes(value)
              ? formData.family_status.filter((v) => v !== value)
              : [...formData.family_status, value];
            setFormData({ ...formData, family_status: next });
          }}
          onChipRemove={(value) =>
            setFormData({
              ...formData,
              family_status: formData.family_status.filter(
                (v) => v !== value,
              ),
            })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Children
        </label>
        <MultiSelectDropdown
          name="children"
          values={formData.children}
          options={childrenOptions.map((option) => ({
            ...option,
            disabled:
              hasNoChildrenSelected && option.value !== NO_CHILDREN_VALUE,
          }))}
          placeholder="Select children statuses..."
          openDropdown={openDropdown}
          onToggleDropdown={onToggleDropdown}
          focusRing={false}
          onOptionClick={(value) => {
            const next = formData.children.includes(value)
              ? formData.children.filter((v) => v !== value)
              : value === NO_CHILDREN_VALUE
                ? [NO_CHILDREN_VALUE]
                : [
                    ...formData.children.filter(
                      (v) => v !== NO_CHILDREN_VALUE,
                    ),
                    value,
                  ];
            setFormData({ ...formData, children: next });
          }}
          onChipRemove={(value) =>
            setFormData({
              ...formData,
              children: formData.children.filter((v) => v !== value),
            })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Operator
        </label>
        <SingleSelectDropdown
          name="operator"
          openDropdown={openDropdown}
          onToggleDropdown={onToggleDropdown}
          disabled={operatorsLoading}
          displayClassName={
            formData.operator_id ? "text-white" : "text-white/50"
          }
          display={
            operatorsLoading
              ? "Loading operators..."
              : formData.operator_id
                ? (() => {
                    const op = operators.find(
                      (o) => o.id === formData.operator_id,
                    );
                    const displayName = operatorDisplayName(op);
                    return (
                      displayName +
                      (op?.email && displayName !== op?.email
                        ? ` (${op.email})`
                        : "")
                    );
                  })()
                : "Select an operator"
          }
          options={operators.map((operator) => {
            const displayName = operatorDisplayName(operator);
            return {
              value: operator.id,
              selected: formData.operator_id === operator.id,
              content: (
                <>
                  {displayName}{" "}
                  {operator.email && displayName !== operator.email
                    ? `(${operator.email})`
                    : ""}
                </>
              ),
            };
          })}
          onSelect={(value) => {
            setFormData({
              ...formData,
              operator_id: value,
            });
            setOpenDropdown(null);
          }}
        />
        {!operatorsLoading && operators.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">
            No operators available
          </p>
        )}
      </div>
    </>
  );
};
