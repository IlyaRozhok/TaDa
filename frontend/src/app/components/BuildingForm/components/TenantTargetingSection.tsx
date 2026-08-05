import React, { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
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
        <div className="relative" data-dropdown>
          <div
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center"
            onClick={() => onToggleDropdown("tenant_type")}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {formData.tenant_type.length > 0 ? (
                formData.tenant_type.map((value) => {
                  const option = tenantTypeOptions.find(
                    (opt) => opt.value === value,
                  );
                  return (
                    <span
                      key={value}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                    >
                      {option?.label ?? value}
                      <button
                        type="button"
                        className="ml-1 text-white/70 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({
                            ...formData,
                            tenant_type: formData.tenant_type.filter(
                              (t) => t !== value,
                            ),
                          });
                        }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })
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
          {openDropdown === "tenant_type" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {tenantTypeOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                  onClick={() => {
                    const newTenantType = formData.tenant_type.includes(
                      option.value,
                    )
                      ? formData.tenant_type.filter(
                          (t) => t !== option.value,
                        )
                      : [...formData.tenant_type, option.value];
                    setFormData({
                      ...formData,
                      tenant_type: newTenantType,
                    });
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.tenant_type.includes(
                      option.value,
                    )}
                    readOnly
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Occupation
        </label>
        <div className="relative" data-dropdown>
          <div
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white cursor-pointer min-h-[40px] flex items-center"
            onClick={() => onToggleDropdown("occupation")}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {formData.occupation.length > 0 ? (
                formData.occupation.map((value) => {
                  const option = occupationOptions.find(
                    (opt) => opt.value === value,
                  );
                  return (
                    <span
                      key={value}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                    >
                      {option?.label ?? value}
                      <button
                        type="button"
                        className="ml-1 text-white/70 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({
                            ...formData,
                            occupation: formData.occupation.filter(
                              (v) => v !== value,
                            ),
                          });
                        }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-white/50">Select occupations...</span>
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
          {openDropdown === "occupation" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {occupationOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                  onClick={() => {
                    const next = formData.occupation.includes(option.value)
                      ? formData.occupation.filter(
                          (v) => v !== option.value,
                        )
                      : [...formData.occupation, option.value];
                    setFormData({ ...formData, occupation: next });
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.occupation.includes(option.value)}
                    readOnly
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Family Status
        </label>
        <div className="relative" data-dropdown>
          <div
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white cursor-pointer min-h-[40px] flex items-center"
            onClick={() => onToggleDropdown("family_status")}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {formData.family_status.length > 0 ? (
                formData.family_status.map((value) => {
                  const option = familyStatusOptions.find(
                    (opt) => opt.value === value,
                  );
                  return (
                    <span
                      key={value}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                    >
                      {option?.label ?? value}
                      <button
                        type="button"
                        className="ml-1 text-white/70 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({
                            ...formData,
                            family_status: formData.family_status.filter(
                              (v) => v !== value,
                            ),
                          });
                        }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-white/50">
                  Select family statuses...
                </span>
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
          {openDropdown === "family_status" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {familyStatusOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                  onClick={() => {
                    const next = formData.family_status.includes(
                      option.value,
                    )
                      ? formData.family_status.filter(
                          (v) => v !== option.value,
                        )
                      : [...formData.family_status, option.value];
                    setFormData({ ...formData, family_status: next });
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.family_status.includes(option.value)}
                    readOnly
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Children
        </label>
        <div className="relative" data-dropdown>
          <div
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white cursor-pointer min-h-[40px] flex items-center"
            onClick={() => onToggleDropdown("children")}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {formData.children.length > 0 ? (
                formData.children.map((value) => {
                  const option = childrenOptions.find(
                    (opt) => opt.value === value,
                  );
                  return (
                    <span
                      key={value}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                    >
                      {option?.label ?? value}
                      <button
                        type="button"
                        className="ml-1 text-white/70 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({
                            ...formData,
                            children: formData.children.filter(
                              (v) => v !== value,
                            ),
                          });
                        }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-white/50">
                  Select children statuses...
                </span>
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
          {openDropdown === "children" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {childrenOptions.map((option) => {
                const isNoOption = option.value === NO_CHILDREN_VALUE;
                const isDisabled = hasNoChildrenSelected && !isNoOption;
                return (
                <div
                  key={option.value}
                  className={`px-4 py-2 text-white flex items-center space-x-2 ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-white/20 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (isDisabled) return;
                    const next = formData.children.includes(option.value)
                      ? formData.children.filter((v) => v !== option.value)
                      : option.value === NO_CHILDREN_VALUE
                        ? [NO_CHILDREN_VALUE]
                        : [
                            ...formData.children.filter(
                              (v) => v !== NO_CHILDREN_VALUE,
                            ),
                            option.value,
                          ];
                    setFormData({ ...formData, children: next });
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.children.includes(option.value)}
                    disabled={isDisabled}
                    readOnly
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{option.label}</span>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Operator
        </label>
        <div className="relative" data-dropdown>
          <div
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
            onClick={() =>
              !operatorsLoading && onToggleDropdown("operator")
            }
          >
            <span
              className={
                formData.operator_id ? "text-white" : "text-white/50"
              }
            >
              {operatorsLoading
                ? "Loading operators..."
                : formData.operator_id
                  ? (() => {
                      const op = operators.find(
                        (o) => o.id === formData.operator_id,
                      );
                      const displayName =
                        op?.operatorProfile?.company_name ||
                        op?.operatorProfile?.full_name ||
                        op?.full_name ||
                        op?.email;
                      return (
                        displayName +
                        (op?.email && displayName !== op?.email
                          ? ` (${op.email})`
                          : "")
                      );
                    })()
                  : "Select an operator"}
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
          {!operatorsLoading && openDropdown === "operator" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {operators.map((operator) => {
                const displayName =
                  operator.operatorProfile?.company_name ||
                  operator.operatorProfile?.full_name ||
                  operator.full_name ||
                  operator.email;
                return (
                  <div
                    key={operator.id}
                    className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                      formData.operator_id === operator.id
                        ? "bg-white/10"
                        : ""
                    }`}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        operator_id: operator.id,
                      });
                      setOpenDropdown(null);
                    }}
                  >
                    {displayName}{" "}
                    {operator.email && displayName !== operator.email
                      ? `(${operator.email})`
                      : ""}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {!operatorsLoading && operators.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">
            No operators available
          </p>
        )}
      </div>
    </>
  );
};
