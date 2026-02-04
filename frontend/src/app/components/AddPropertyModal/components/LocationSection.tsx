import React from "react";
import { FormField, Input, Select } from "../../FormField";
import { PropertyFormData, Building } from "../types";
import { useLocalizedFormOptions } from "../../../../shared/hooks/useLocalizedFormOptions";

interface LocationSectionProps {
  formData: PropertyFormData;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  buildings: Building[];
  openDropdown: string | null;
  onFieldChange: (field: string, value: any) => void;
  onFieldBlur: (field: string) => void;
  onToggleDropdown: (dropdown: string) => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  formData,
  errors,
  touched,
  buildings,
  openDropdown,
  onFieldChange,
  onFieldBlur,
  onToggleDropdown,
}) => {
  const {
    buildingTypeOptions,
    propertyTypeOptions,
    furnishingOptions,
    billsOptions,
  } = useLocalizedFormOptions();

  const isReadonly = formData.building_type !== "private_landlord" && !!formData.building_id;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Building Type"
          required
          error={errors.building_type}
          touched={touched.building_type}
        >
          <Select
            value={formData.building_type}
            onChange={(e) => onFieldChange("building_type", e.target.value)}
            onBlur={() => onFieldBlur("building_type")}
            error={touched.building_type && !!errors.building_type}
            options={buildingTypeOptions}
            placeholder="Select building type"
          />
        </FormField>

        {formData.building_type !== "private_landlord" && (
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Building
            </label>
            <div className="relative" data-dropdown>
              <div
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                onClick={() => onToggleDropdown("building")}
              >
                <span className={formData.building_id ? "text-white" : "text-white/50"}>
                  {formData.building_id
                    ? buildings.find((b) => b.id === formData.building_id)?.name
                    : "Select Building"}
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
              {openDropdown === "building" && (
                <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {buildings
                    .filter((building) => building.operator_id === formData.operator_id)
                    .map((building) => (
                      <div
                        key={building.id}
                        className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white border-b border-white/10 last:border-b-0"
                        onClick={() => {
                          onFieldChange("building_id", building.id);
                          onToggleDropdown("building");
                        }}
                      >
                        <div className="font-medium">{building.name}</div>
                        <div className="text-sm text-white/70">{building.address}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
          label="Price (£/month)"
          required
          error={errors.price}
          touched={touched.price}
        >
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => onFieldChange("price", e.target.value)}
            onBlur={() => onFieldBlur("price")}
            error={touched.price && !!errors.price}
            placeholder="2000"
            step="0.01"
          />
        </FormField>

        <FormField
          label="Security Deposit (£)"
          error={errors.security_deposit}
          touched={touched.security_deposit}
        >
          <Input
            type="number"
            value={formData.security_deposit}
            onChange={(e) => onFieldChange("security_deposit", e.target.value)}
            onBlur={() => onFieldBlur("security_deposit")}
            error={touched.security_deposit && !!errors.security_deposit}
            placeholder="2000"
            step="0.01"
          />
        </FormField>

        <FormField
          label="Admin Fee (£)"
          error={errors.admin_fee}
          touched={touched.admin_fee}
        >
          <Input
            type="number"
            value={formData.admin_fee}
            onChange={(e) => onFieldChange("admin_fee", e.target.value)}
            onBlur={() => onFieldBlur("admin_fee")}
            error={touched.admin_fee && !!errors.admin_fee}
            placeholder="200"
            step="0.01"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FormField
          label="Property Type"
          required
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
          required
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

        <FormField
          label="Bills"
          required
          error={errors.bills}
          touched={touched.bills}
        >
          <Select
            value={formData.bills}
            onChange={(e) => onFieldChange("bills", e.target.value)}
            onBlur={() => onFieldBlur("bills")}
            error={touched.bills && !!errors.bills}
            options={billsOptions}
            placeholder="Select bills"
          />
        </FormField>

        <FormField
          label="Available From"
          required
          error={errors.available_from}
          touched={touched.available_from}
        >
          <Input
            type="date"
            value={formData.available_from}
            onChange={(e) => onFieldChange("available_from", e.target.value)}
            onBlur={() => onFieldBlur("available_from")}
            error={touched.available_from && !!errors.available_from}
          />
        </FormField>
      </div>
    </div>
  );
};