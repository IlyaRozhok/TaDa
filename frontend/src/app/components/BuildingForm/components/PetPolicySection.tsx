import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { Minus } from "lucide-react";
import { SingleSelectDropdown } from "@/app/components/form/SingleSelectDropdown";
import type { BuildingFormData, Pet } from "../types";

const PET_SIZE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

interface PetPolicySectionProps {
  formData: BuildingFormData;
  setFormData: Dispatch<SetStateAction<BuildingFormData>>;
  openDropdown: string | null;
  setOpenDropdown: Dispatch<SetStateAction<string | null>>;
  onToggleDropdown: (name: string) => void;
  addPet: () => void;
  updatePet: (index: number, field: keyof Pet, value: any) => void;
  removePet: (index: number) => void;
  mode: "create" | "edit";
}

export const PetPolicySection: React.FC<PetPolicySectionProps> = ({
  formData,
  setFormData,
  openDropdown,
  setOpenDropdown,
  onToggleDropdown,
  addPet,
  updatePet,
  removePet,
  mode,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
        Pet Policy
      </h4>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="pet_policy"
          checked={formData.pet_policy}
          onChange={(e) =>
            setFormData({ ...formData, pet_policy: e.target.checked })
          }
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <label
          htmlFor="pet_policy"
          className="text-sm font-medium text-white/90"
        >
          Pets Allowed
        </label>
      </div>

      {formData.pet_policy && (
        <div className="ml-6 space-y-4">
          {(formData.pets || []).map((pet, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-md p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium text-white">
                  Pet {index + 1}
                </h5>
                <button
                  type="button"
                  onClick={() => removePet(index)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <Minus className="w-4 h-4" />
                </button>
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
                    displayClassName="capitalize"
                    display={pet.type}
                    options={["dog", "cat", "other"].map((type) => ({
                      value: type,
                      content: type,
                      selected: pet.type === type,
                      className: "capitalize",
                    }))}
                    onSelect={(type) => {
                      updatePet(index, "type", type);
                      setOpenDropdown(null);
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
                        updatePet(index, "customType", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
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
                    displayClassName={
                      pet.size ? "capitalize" : "text-white/50"
                    }
                    display={pet.size ? pet.size : "Not specified"}
                    options={PET_SIZE_OPTIONS.map((size) => ({
                      value: size.value,
                      content: size.label,
                      selected: (pet.size || "") === size.value,
                    }))}
                    onSelect={(value) => {
                      updatePet(index, "size", value || undefined);
                      setOpenDropdown(null);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addPet}
            className={`flex items-center gap-2 px-4 py-2 ${
              mode === "edit" ? "bg-gray-100" : "bg-gray-200"
            } text-black rounded-md hover:bg-gray-200`}
          >
            Add Pet Type
          </button>
        </div>
      )}
    </div>
  );
};
