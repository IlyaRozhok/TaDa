import React from "react";
import { FormField, Input, Select } from "../../FormField";
import { PropertyFormData } from "../types";
import { useLocalizedFormOptions } from "../../../../shared/hooks/useLocalizedFormOptions";

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
  const {
    propertyTypeOptions,
    furnishingOptions,
    billsOptions,
    tenantTypeOptions,
    durationOptions,
  } = useLocalizedFormOptions();

  const isReadonly =
    formData.building_type !== "private_landlord" && !!formData.building_id;

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
        <div className="relative" data-dropdown>
          <div
            className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white min-h-[40px] flex items-center ${
              isReadonly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
            onClick={() => !isReadonly && onToggleDropdown("tenant_types")}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {(formData.tenant_types || []).length > 0 ? (
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
                      {!isReadonly && (
                        <button
                          type="button"
                          className="ml-1 text-white/70 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFieldChange(
                              "tenant_types",
                              formData.tenant_types.filter((t) => t !== value),
                            );
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
            {!isReadonly && (
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
          {!isReadonly && openDropdown === "tenant_types" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {tenantTypeOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                  onClick={() => {
                    const newTenantTypes = formData.tenant_types.includes(
                      option.value,
                    )
                      ? formData.tenant_types.filter((t) => t !== option.value)
                      : [...formData.tenant_types, option.value];
                    onFieldChange("tenant_types", newTenantTypes);
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
      </FormField>

      {/* Let Duration (multi-select) */}
      <FormField
        label="Let Duration"
        error={errors.let_duration}
        touched={touched.let_duration}
      >
        <div className="relative" data-dropdown>
          <div
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white min-h-[40px] flex items-center cursor-pointer"
            onClick={() => onToggleDropdown("let_duration")}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {(formData.let_duration || []).length > 0 ? (
                formData.let_duration.map((value) => {
                  const option = durationOptions.find(
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
                          onFieldChange(
                            "let_duration",
                            formData.let_duration.filter((d) => d !== value),
                          );
                        }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-white/50">Select duration...</span>
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
          {openDropdown === "let_duration" && (
            <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {durationOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center space-x-2"
                  onClick={() => {
                    const current = formData.let_duration || [];
                    const newDuration = current.includes(option.value)
                      ? current.filter((d) => d !== option.value)
                      : [...current, option.value];
                    onFieldChange("let_duration", newDuration);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(formData.let_duration || []).includes(
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
      </FormField>
    </div>
  );
};
