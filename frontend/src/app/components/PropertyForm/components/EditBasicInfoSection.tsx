import React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { EditPropertyFormData, OperatorOption } from "../types";
import type { Building as ApiBuilding } from "@/store/api/buildings.api";
import { BuildingType, PropertyType } from "@/app/types/property";

interface EditBasicInfoSectionProps {
  formData: EditPropertyFormData;
  setFormData: Dispatch<SetStateAction<EditPropertyFormData>>;
  openDropdown: string | null;
  setOpenDropdown: Dispatch<SetStateAction<string | null>>;
  toggleDropdown: (name: string) => void;
  buildings: ApiBuilding[];
  availableOperators: OperatorOption[];
  operatorsLoading: boolean;
  buildingError: string | null;
  setBuildingError: Dispatch<SetStateAction<string | null>>;
  buildingTouched: boolean;
  setBuildingTouched: Dispatch<SetStateAction<boolean>>;
  isFieldReadonly: boolean;
  buildingTypeOptions: { value: string; label: string }[];
  propertyTypeOptions: { value: string; label: string }[];
}

/**
 * Title, apartment number, the building/operator pair, building type, price,
 * deposit, available-from, property type and the readonly-aware address.
 * A fragment inside the section grid the orchestrator owns; the raw-input
 * markup is the edit monolith's, moved verbatim (the create form uses
 * FormField with validation — the pair is kept different on purpose).
 */
export const EditBasicInfoSection: React.FC<EditBasicInfoSectionProps> = ({
  formData,
  setFormData,
  openDropdown,
  setOpenDropdown,
  toggleDropdown,
  buildings,
  availableOperators,
  operatorsLoading,
  buildingError,
  setBuildingError,
  buildingTouched,
  setBuildingTouched,
  isFieldReadonly,
  buildingTypeOptions,
  propertyTypeOptions,
}) => {
  return (
    <>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/90 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                placeholder="Enter property title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Apartment Number
              </label>
              <input
                type="text"
                value={formData.apartment_number}
                onChange={(e) =>
                  setFormData({ ...formData, apartment_number: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              />
            </div>

            {formData.building_type !== "private_landlord" ? (
              <div data-building-field>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Building *
                </label>
                <div className="relative" data-dropdown>
                  <div
                    className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between ${
                      buildingError && buildingTouched
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-white/20"
                    }`}
                    onClick={() => {
                      toggleDropdown("building");
                      setBuildingTouched(true);
                    }}
                  >
                    <span
                      className={
                        formData.building_id ? "text-white" : "text-white/50"
                      }
                    >
                      {formData.building_id
                        ? buildings.find((b) => b.id === formData.building_id)
                            ?.name +
                          " - " +
                          buildings.find((b) => b.id === formData.building_id)
                            ?.address
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
                      {buildings.map((building) => (
                        <div
                          key={building.id}
                          className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center ${
                            formData.building_id === building.id
                              ? "bg-white/10"
                              : ""
                          }`}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              building_id: building.id,
                            });
                            setBuildingError(null);
                            setOpenDropdown(null);
                          }}
                        >
                          {building.name} - {building.address}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {buildingError && buildingTouched && (
                  <p className="mt-1 text-sm text-red-500">{buildingError}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Operator
                </label>
                <div className="relative" data-dropdown>
                  <div
                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                    onClick={() => toggleDropdown("operator")}
                  >
                    <span
                      className={
                        formData.operator_id ? "text-white" : "text-white/50"
                      }
                    >
                      {operatorsLoading
                        ? "Loading operators..."
                        : formData.operator_id
                          ? availableOperators.find(
                              (o) => o.id === formData.operator_id,
                            )?.full_name ||
                            availableOperators.find(
                              (o) => o.id === formData.operator_id,
                            )?.email
                          : "Select Operator"}
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
                  {openDropdown === "operator" && !operatorsLoading && (
                    <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {availableOperators.map((operator) => (
                        <div
                          key={operator.id}
                          className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white flex items-center ${
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
                          {operator.full_name || operator.email}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Building Type
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("building_type")}
                >
                  <span
                    className={
                      formData.building_type ? "text-white" : "text-white/50"
                    }
                  >
                    {formData.building_type
                      ? (buildingTypeOptions.find(
                          (o) => o.value === formData.building_type,
                        )?.label ??
                        formData.building_type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase()))
                      : "Select Type"}
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
                {openDropdown === "building_type" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {buildingTypeOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          formData.building_type === option.value
                            ? "bg-white/10"
                            : ""
                        }`}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            building_type: option.value as BuildingType,
                          });
                          setOpenDropdown(null);
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Price (£ PCM)
              </label>
              <input
                type="number"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Deposit (£)
              </label>
              <input
                type="number"
                value={formData.deposit || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deposit:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Available From
              </label>
              <input
                type="date"
                value={formData.available_from || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    available_from: e.target.value || null,
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Property Type
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("property_type")}
                >
                  <span
                    className={
                      formData.property_type ? "text-white" : "text-white/50"
                    }
                  >
                    {formData.property_type
                      ? (propertyTypeOptions.find(
                          (o) => o.value === formData.property_type,
                        )?.label ?? formData.property_type)
                      : "Select Type"}
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
                {openDropdown === "property_type" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {propertyTypeOptions.map((option, idx) => (
                      <div
                        key={`${option.value}-${idx}`}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          formData.property_type === option.value
                            ? "bg-white/10"
                            : ""
                        }`}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            property_type: option.value as PropertyType,
                          });
                          setOpenDropdown(null);
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Address field - readonly if linked to building */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Address{" "}
                {isFieldReadonly && (
                  <span className="text-white/50 text-xs">(from building)</span>
                )}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                readOnly={isFieldReadonly}
                className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 ${
                  isFieldReadonly ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>
    </>
  );
};
