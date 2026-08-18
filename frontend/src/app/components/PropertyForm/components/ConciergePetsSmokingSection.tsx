import React from "react";
import { Minus } from "lucide-react";
import { SingleSelectDropdown } from "@/app/components/form/SingleSelectDropdown";
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
                    <SingleSelectDropdown
                      name={`pet_type_${index}`}
                      openDropdown={openDropdown}
                      onToggleDropdown={onToggleDropdown}
                      focusRing={false}
                      readonly={isReadonly}
                      displayClassName="capitalize"
                      display={pet.type}
                      options={(["dog", "cat", "other"] as const).map(
                        (type) => ({
                          value: type,
                          content: type,
                          selected: pet.type === type,
                          className: "capitalize",
                        }),
                      )}
                      onSelect={(value) => {
                        updatePet(index, {
                          type: value as "dog" | "cat" | "other",
                        });
                        onToggleDropdown(`pet_type_${index}`);
                      }}
                    />
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
                    <SingleSelectDropdown
                      name={`pet_size_${index}`}
                      openDropdown={openDropdown}
                      onToggleDropdown={onToggleDropdown}
                      focusRing={false}
                      readonly={isReadonly}
                      displayClassName={
                        pet.size ? "capitalize" : "text-white/50"
                      }
                      display={pet.size ? pet.size : "Not specified"}
                      options={[
                        { value: "", label: "Not specified" },
                        { value: "small", label: "Small" },
                        { value: "medium", label: "Medium" },
                        { value: "large", label: "Large" },
                      ].map((size) => ({
                        value: size.value,
                        content: size.label,
                        selected: (pet.size || "") === size.value,
                      }))}
                      onSelect={(value) => {
                        updatePet(index, {
                          size:
                            value === ""
                              ? undefined
                              : (value as "small" | "medium" | "large"),
                        });
                        onToggleDropdown(`pet_size_${index}`);
                      }}
                    />
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

    </div>
  );
};
