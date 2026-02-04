import React from "react";
import { FormField, Input } from "../../FormField";
import { PropertyFormData, User } from "../types";

interface BasicInfoSectionProps {
  formData: PropertyFormData;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  availableOperators: User[];
  operatorsLoading: boolean;
  openDropdown: string | null;
  onFieldChange: (field: string, value: any) => void;
  onFieldBlur: (field: string) => void;
  onToggleDropdown: (dropdown: string) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  errors,
  touched,
  availableOperators,
  operatorsLoading,
  openDropdown,
  onFieldChange,
  onFieldBlur,
  onToggleDropdown,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Title"
        required
        error={errors.title}
        touched={touched.title}
      >
        <Input
          type="text"
          value={formData.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
          onBlur={() => onFieldBlur("title")}
          error={touched.title && !!errors.title}
          placeholder="e.g. Modern 2BR Apartment"
        />
      </FormField>

      <FormField
        label="Apartment Number"
        error={errors.apartment_number}
        touched={touched.apartment_number}
      >
        <Input
          type="text"
          value={formData.apartment_number}
          onChange={(e) => onFieldChange("apartment_number", e.target.value)}
          onBlur={() => onFieldBlur("apartment_number")}
          error={touched.apartment_number && !!errors.apartment_number}
          placeholder="e.g. 2A, 15B"
        />
      </FormField>

      {formData.building_type === "private_landlord" && (
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Operator
          </label>
          <div className="relative" data-dropdown>
            <div
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
              onClick={() => onToggleDropdown("operator")}
            >
              <span
                className={
                  formData.operator_id ? "text-white" : "text-white/50"
                }
              >
                {formData.operator_id
                  ? availableOperators.find((o) => o.id === formData.operator_id)?.full_name ||
                    availableOperators.find((o) => o.id === formData.operator_id)?.email
                  : operatorsLoading ? "Loading operators..." : "Select Operator"}
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
            {openDropdown === "operator" && (
              <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {availableOperators.map((operator) => (
                  <div
                    key={operator.id}
                    className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white border-b border-white/10 last:border-b-0"
                    onClick={() => {
                      onFieldChange("operator_id", operator.id);
                      onToggleDropdown("operator");
                    }}
                  >
                    <div className="font-medium">
                      {operator.full_name || operator.email}
                    </div>
                    {operator.full_name && (
                      <div className="text-sm text-white/70">{operator.email}</div>
                    )}
                  </div>
                ))}
                {availableOperators.length === 0 && !operatorsLoading && (
                  <div className="px-4 py-2 text-white/50">No operators available</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};