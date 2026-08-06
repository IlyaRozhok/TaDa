import React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { EditPropertyFormData } from "../types";
import { Bills, Furnishing } from "@/app/types/property";
import { sqFtToSqM, formatSqMForForm } from "@/shared/lib/area";

interface EditPropertyDetailsSectionProps {
  formData: EditPropertyFormData;
  setFormData: Dispatch<SetStateAction<EditPropertyFormData>>;
  openDropdown: string | null;
  setOpenDropdown: Dispatch<SetStateAction<string | null>>;
  toggleDropdown: (name: string) => void;
  furnishingOptions: { value: string; label: string }[];
  durationOptions: { value: string; label: string }[];
}

/**
 * Furnishing, let duration, bills, bedrooms, bathrooms, floor and the
 * square-feet input paired with the derived read-only square-meters field.
 * A fragment inside the orchestrator's grid, moved verbatim.
 */
export const EditPropertyDetailsSection: React.FC<
  EditPropertyDetailsSectionProps
> = ({
  formData,
  setFormData,
  openDropdown,
  setOpenDropdown,
  toggleDropdown,
  furnishingOptions,
  durationOptions,
}) => {
  return (
    <>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Furnishing
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("furnishing")}
                >
                  <span
                    className={
                      formData.furnishing ? "text-white" : "text-white/50"
                    }
                  >
                    {formData.furnishing
                      ? (furnishingOptions.find(
                          (o) => o.value === formData.furnishing,
                        )?.label ??
                        formData.furnishing
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
                {openDropdown === "furnishing" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {furnishingOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          formData.furnishing === option.value
                            ? "bg-white/10"
                            : ""
                        }`}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            furnishing: option.value as Furnishing,
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
                Let Duration
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center"
                  onClick={() => toggleDropdown("let_duration")}
                >
                  <div className="flex flex-wrap gap-1 flex-1">
                    {(formData.let_duration || []).length > 0 ? (
                      (formData.let_duration || []).map((value) => {
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
                                setFormData({
                                  ...formData,
                                  let_duration: (
                                    formData.let_duration || []
                                  ).filter((d) => d !== value),
                                });
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
                          setFormData({
                            ...formData,
                            let_duration: newDuration,
                          });
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
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bills
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("bills")}
                >
                  <span
                    className={formData.bills ? "text-white" : "text-white/50"}
                  >
                    {formData.bills
                      ? formData.bills.charAt(0).toUpperCase() +
                        formData.bills.slice(1)
                      : "Select Option"}
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
                {openDropdown === "bills" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.values(Bills).map((type) => (
                      <div
                        key={type}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          formData.bills === type ? "bg-white/10" : ""
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, bills: type });
                          setOpenDropdown(null);
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bedrooms
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("bedrooms")}
                >
                  <span
                    className={
                      formData.bedrooms ? "text-white" : "text-white/50"
                    }
                  >
                    {formData.bedrooms
                      ? formData.bedrooms >= 5
                        ? "5+"
                        : formData.bedrooms
                      : "Select Bedrooms"}
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
                {openDropdown === "bedrooms" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <div
                        key={value}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          (value === 5 &&
                            formData.bedrooms &&
                            formData.bedrooms >= 5) ||
                          (value < 5 && formData.bedrooms === value)
                            ? "bg-white/10"
                            : ""
                        }`}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            bedrooms: value,
                          });
                          setOpenDropdown(null);
                        }}
                      >
                        {value === 5 ? "5+" : value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bathrooms
              </label>
              <div className="relative" data-dropdown>
                <div
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white cursor-pointer min-h-[40px] flex items-center justify-between"
                  onClick={() => toggleDropdown("bathrooms")}
                >
                  <span
                    className={
                      formData.bathrooms ? "text-white" : "text-white/50"
                    }
                  >
                    {formData.bathrooms
                      ? formData.bathrooms >= 4
                        ? "4+"
                        : formData.bathrooms
                      : "Select Bathrooms"}
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
                {openDropdown === "bathrooms" && (
                  <div className="absolute z-20 w-full mt-1 bg-gray-900/95 backdrop-blur-[10px] border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {[1, 2, 3, 4].map((value) => (
                      <div
                        key={value}
                        className={`px-4 py-2 hover:bg-white/20 cursor-pointer text-white ${
                          (value === 4 &&
                            formData.bathrooms &&
                            formData.bathrooms >= 4) ||
                          (value < 4 && formData.bathrooms === value)
                            ? "bg-white/10"
                            : ""
                        }`}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            bathrooms: value,
                          });
                          setOpenDropdown(null);
                        }}
                      >
                        {value === 4 ? "4+" : value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Floor
              </label>
              <input
                type="number"
                value={formData.floor || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    floor:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Square Feet
              </label>
              <input
                type="number"
                value={formData.square_feet ?? ""}
                onChange={(e) => {
                  const raw =
                    e.target.value === "" ? null : Number(e.target.value);
                  const sqFt = raw != null && !isNaN(raw) ? raw : null;
                  setFormData({
                    ...formData,
                    square_feet: sqFt,
                    square_meters: sqFt == null ? null : sqFtToSqM(sqFt),
                  });
                }}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Square Meters
              </label>
              <input
                type="text"
                value={formatSqMForForm(formData.square_meters)}
                readOnly
                tabIndex={-1}
                placeholder="—"
                className="w-full px-4 py-2 bg-white/5 backdrop-blur-[5px] border border-white/20 rounded-lg text-white/70 placeholder-white/50 cursor-not-allowed"
              />
            </div>
    </>
  );
};
