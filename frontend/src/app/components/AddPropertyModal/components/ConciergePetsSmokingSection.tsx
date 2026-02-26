import React from "react";
import { Minus } from "lucide-react";
import { PropertyFormData, Pet } from "../types";

interface ConciergePetsSmokingSectionProps {
  formData: PropertyFormData;
  openDropdown: string | null;
  onFieldChange: (field: string, value: any) => void;
  onToggleDropdown: (dropdown: string) => void;
  addPet: () => void;
  updatePet: (index: number, updates: Partial<Pet>) => void;
  removePet: (index: number) => void;
}

export const ConciergePetsSmokingSection: React.FC<
  ConciergePetsSmokingSectionProps
> = ({
  formData,
  openDropdown,
  onFieldChange,
  onToggleDropdown,
  addPet,
  updatePet,
  removePet,
}) => {
  const isReadonly =
    formData.building_type !== "private_landlord" && !!formData.building_id;
  const pets = formData.pets || [];

  return (
    <div className="space-y-6">
      {/* Concierge */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
          Concierge{" "}
          {isReadonly && (
            <span className="text-white/50 text-xs">(from building)</span>
          )}
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_concierge_add"
            checked={formData.is_concierge}
            onChange={(e) =>
              onFieldChange("is_concierge", e.target.checked)
            }
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="is_concierge_add"
            className="text-sm font-medium text-white/90"
          >
            Has Concierge Service
          </label>
        </div>
        {formData.is_concierge && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Opening Hour (0-23)
              </label>
              <input
                type="number"
                min={0}
                max={23}
                value={formData.concierge_hours?.from ?? ""}
                onChange={(e) => {
                  const inputVal = e.target.value;
                  const val =
                    inputVal === ""
                      ? undefined
                      : Math.max(
                          0,
                          Math.min(23, parseInt(inputVal, 10) || 0),
                        );
                  onFieldChange("concierge_hours", {
                    ...formData.concierge_hours,
                    from: val,
                    to: formData.concierge_hours?.to,
                  });
                }}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Closing Hour (0-23)
              </label>
              <input
                type="number"
                min={0}
                max={23}
                value={formData.concierge_hours?.to ?? ""}
                onChange={(e) => {
                  const inputVal = e.target.value;
                  const val =
                    inputVal === ""
                      ? undefined
                      : Math.max(
                          0,
                          Math.min(23, parseInt(inputVal, 10) || 0),
                        );
                  onFieldChange("concierge_hours", {
                    ...formData.concierge_hours,
                    from: formData.concierge_hours?.from,
                    to: val,
                  });
                }}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Pets */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
          Pet Policy{" "}
          {isReadonly && (
            <span className="text-white/50 text-xs">(from building)</span>
          )}
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="pet_policy_add"
            checked={formData.pet_policy}
            onChange={(e) =>
              !isReadonly && onFieldChange("pet_policy", e.target.checked)
            }
            disabled={isReadonly}
            className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${
              isReadonly ? "opacity-60 cursor-not-allowed" : ""
            }`}
          />
          <label
            htmlFor="pet_policy_add"
            className="text-sm font-medium text-white/90"
          >
            Pets Allowed
          </label>
        </div>
        {formData.pet_policy && (
          <div className="ml-6 space-y-4">
            {pets.map((pet, index) => (
              <div
                key={index}
                className="border border-white/20 rounded-lg p-4 bg-white/5"
              >
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-medium text-white">Pet {index + 1}</h5>
                  {!isReadonly && (
                    <button
                      type="button"
                      onClick={() => removePet(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Type
                    </label>
                    <div className="relative" data-dropdown>
                      <div
                        className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white min-h-[40px] flex items-center justify-between ${
                          isReadonly
                            ? "opacity-60 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        onClick={() =>
                          !isReadonly &&
                          onToggleDropdown(`pet_type_${index}`)
                        }
                      >
                        <span className="capitalize">{pet.type}</span>
                        {!isReadonly && (
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
                        )}
                      </div>
                      {!isReadonly &&
                        openDropdown === `pet_type_${index}` && (
                          <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {(["dog", "cat", "other"] as const).map((type) => (
                              <div
                                key={type}
                                className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white capitalize ${
                                  pet.type === type ? "bg-white/10" : ""
                                }`}
                                onClick={() => {
                                  updatePet(index, { type });
                                  onToggleDropdown(`pet_type_${index}`);
                                }}
                              >
                                {type}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                  {pet.type === "other" && (
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Custom Type
                      </label>
                      <input
                        type="text"
                        value={pet.customType || ""}
                        onChange={(e) =>
                          updatePet(index, {
                            customType: e.target.value || undefined,
                          })
                        }
                        readOnly={isReadonly}
                        className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white placeholder-white/50"
                        placeholder="e.g., Hamster"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Size (Optional)
                    </label>
                    <div className="relative" data-dropdown>
                      <div
                        className={`w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-white min-h-[40px] flex items-center justify-between ${
                          isReadonly
                            ? "opacity-60 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        onClick={() =>
                          !isReadonly &&
                          onToggleDropdown(`pet_size_${index}`)
                        }
                      >
                        <span
                          className={
                            pet.size ? "capitalize" : "text-white/50"
                          }
                        >
                          {pet.size ? pet.size : "Not specified"}
                        </span>
                        {!isReadonly && (
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
                        )}
                      </div>
                      {!isReadonly &&
                        openDropdown === `pet_size_${index}` && (
                          <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {[
                              { value: "", label: "Not specified" },
                              { value: "small", label: "Small" },
                              { value: "medium", label: "Medium" },
                              { value: "large", label: "Large" },
                            ].map((size) => (
                              <div
                                key={size.value}
                                className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                                  (pet.size || "") === size.value
                                    ? "bg-white/10"
                                    : ""
                                }`}
                                onClick={() => {
                                  updatePet(index, {
                                    size:
                                      size.value === ""
                                        ? undefined
                                        : (size.value as
                                            | "small"
                                            | "medium"
                                            | "large"),
                                  });
                                  onToggleDropdown(`pet_size_${index}`);
                                }}
                              >
                                {size.label}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!isReadonly && (
              <button
                type="button"
                onClick={addPet}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
              >
                Add Pet Type
              </button>
            )}
          </div>
        )}
      </div>

      {/* Smoking */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
          Other{" "}
          {isReadonly && (
            <span className="text-white/50 text-xs">(from building)</span>
          )}
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="smoking_area_add"
            checked={formData.smoking_area_prop}
            onChange={(e) =>
              !isReadonly &&
              onFieldChange("smoking_area_prop", e.target.checked)
            }
            disabled={isReadonly}
            className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${
              isReadonly ? "opacity-60 cursor-not-allowed" : ""
            }`}
          />
          <label
            htmlFor="smoking_area_add"
            className="text-sm font-medium text-white/90"
          >
            Has Smoking Area
          </label>
        </div>
      </div>
    </div>
  );
};
