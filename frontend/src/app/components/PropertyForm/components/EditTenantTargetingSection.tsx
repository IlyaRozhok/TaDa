import React from "react";
import type { Dispatch, SetStateAction } from "react";
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
 * multi-selects, moved verbatim. A fragment inside the orchestrator's grid.
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
              <div className="relative" data-dropdown>
                <div
                  className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white min-h-[40px] flex items-center ${
                    isFieldReadonly
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={() =>
                    !isFieldReadonly && toggleDropdown("tenant_types")
                  }
                >
                  <div className="flex flex-wrap gap-1 flex-1">
                    {formData.tenant_types.length > 0 ? (
                      formData.tenant_types.map((value) => {
                        const option = tenantTypeOptions.find(
                          (opt) => opt.value === value,
                        );
                        return (
                          <span
                            key={value}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                          >
                            {option?.label ?? value}
                            {!isFieldReadonly && (
                              <button
                                type="button"
                                className="ml-1 text-white/70 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData,
                                    tenant_types: formData.tenant_types.filter(
                                      (t) => t !== value,
                                    ),
                                  });
                                }}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-white/50">Select types...</span>
                    )}
                  </div>
                  {!isFieldReadonly && (
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
                  )}
                </div>
                {!isFieldReadonly && openDropdown === "tenant_types" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {tenantTypeOptions.map((option) => (
                      <div
                        key={option.value}
                        className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                        onClick={() => {
                          const newTenantTypes = formData.tenant_types.includes(
                            option.value,
                          )
                            ? formData.tenant_types.filter(
                                (t) => t !== option.value,
                              )
                            : [...formData.tenant_types, option.value];
                          setFormData({
                            ...formData,
                            tenant_types: newTenantTypes,
                          });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.tenant_types.includes(option.value)}
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
                Occupation{" "}
                {isFieldReadonly && (
                  <span className="text-white/50 text-xs">(from building)</span>
                )}
              </label>
              <div className="relative" data-dropdown>
                <div
                  className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white min-h-[40px] flex items-center ${
                    isFieldReadonly
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={() => !isFieldReadonly && toggleDropdown("occupation")}
                >
                  <div className="flex flex-wrap gap-1 flex-1">
                    {(formData.occupation || []).length > 0 ? (
                      (formData.occupation || []).map((value) => {
                        const option = occupationOptions.find(
                          (opt) => opt.value === value,
                        );
                        return (
                          <span
                            key={value}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                          >
                            {option?.label ?? value}
                            {!isFieldReadonly && (
                              <button
                                type="button"
                                className="ml-1 text-white/70 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData,
                                    occupation: (formData.occupation || []).filter(
                                      (v) => v !== value,
                                    ),
                                  });
                                }}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-white/50">Select occupations...</span>
                    )}
                  </div>
                  {!isFieldReadonly && (
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
                  )}
                </div>
                {!isFieldReadonly && openDropdown === "occupation" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {occupationOptions.map((option) => (
                      <div
                        key={option.value}
                        className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                        onClick={() => {
                          const current = formData.occupation || [];
                          const next = current.includes(option.value)
                            ? current.filter((v) => v !== option.value)
                            : [...current, option.value];
                          setFormData({ ...formData, occupation: next });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={(formData.occupation || []).includes(
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
                Family Status{" "}
                {isFieldReadonly && (
                  <span className="text-white/50 text-xs">(from building)</span>
                )}
              </label>
              <div className="relative" data-dropdown>
                <div
                  className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white min-h-[40px] flex items-center ${
                    isFieldReadonly
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={() =>
                    !isFieldReadonly && toggleDropdown("family_status")
                  }
                >
                  <div className="flex flex-wrap gap-1 flex-1">
                    {(formData.family_status || []).length > 0 ? (
                      (formData.family_status || []).map((value) => {
                        const option = familyStatusOptions.find(
                          (opt) => opt.value === value,
                        );
                        return (
                          <span
                            key={value}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                          >
                            {option?.label ?? value}
                            {!isFieldReadonly && (
                              <button
                                type="button"
                                className="ml-1 text-white/70 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData,
                                    family_status: (
                                      formData.family_status || []
                                    ).filter((v) => v !== value),
                                  });
                                }}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-white/50">
                        Select family statuses...
                      </span>
                    )}
                  </div>
                  {!isFieldReadonly && (
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
                  )}
                </div>
                {!isFieldReadonly && openDropdown === "family_status" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {familyStatusOptions.map((option) => (
                      <div
                        key={option.value}
                        className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                        onClick={() => {
                          const current = formData.family_status || [];
                          const next = current.includes(option.value)
                            ? current.filter((v) => v !== option.value)
                            : [...current, option.value];
                          setFormData({ ...formData, family_status: next });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={(formData.family_status || []).includes(
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
                Children{" "}
                {isFieldReadonly && (
                  <span className="text-white/50 text-xs">(from building)</span>
                )}
              </label>
              <div className="relative" data-dropdown>
                <div
                  className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white min-h-[40px] flex items-center ${
                    isFieldReadonly
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  onClick={() => !isFieldReadonly && toggleDropdown("children")}
                >
                  <div className="flex flex-wrap gap-1 flex-1">
                    {(formData.children || []).length > 0 ? (
                      (formData.children || []).map((value) => {
                        const option = childrenOptions.find(
                          (opt) => opt.value === value,
                        );
                        return (
                          <span
                            key={value}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/20 text-white"
                          >
                            {option?.label ?? value}
                            {!isFieldReadonly && (
                              <button
                                type="button"
                                className="ml-1 text-white/70 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData,
                                    children: (formData.children || []).filter(
                                      (v) => v !== value,
                                    ),
                                  });
                                }}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-white/50">
                        Select children statuses...
                      </span>
                    )}
                  </div>
                  {!isFieldReadonly && (
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
                  )}
                </div>
                {!isFieldReadonly && openDropdown === "children" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {childrenOptions.map((option) => {
                      const isNoOption = option.value === "no";
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
                            const current = formData.children || [];
                            const next = current.includes(option.value)
                              ? current.filter((v) => v !== option.value)
                              : option.value === "no"
                                ? ["no"]
                                : [
                                    ...current.filter((v) => v !== "no"),
                                    option.value,
                                  ];
                            setFormData({ ...formData, children: next });
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={(formData.children || []).includes(
                              option.value,
                            )}
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
    </>
  );
};
