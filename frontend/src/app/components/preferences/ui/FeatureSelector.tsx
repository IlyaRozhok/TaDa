import React from "react";
import { FeatureSelectorProps } from "@/app/types/preferences";

export const FeatureSelector: React.FC<FeatureSelectorProps> = ({
  title,
  options,
  icon: Icon,
  selectedFeatures,
  onToggle,
}) => {
  const selectedCount = selectedFeatures.length;

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-300 p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm border border-slate-200">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <div className="ml-auto">
          <span className="text-sm text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 font-medium">
            {selectedCount} selected
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selectedFeatures.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 text-blue-900 shadow-md ring-2 ring-blue-100"
                  : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center">
                <option.icon
                  className={`h-5 w-5 mr-3 ${
                    isSelected ? "text-blue-600" : "text-slate-600"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    isSelected ? "text-blue-900" : "text-slate-900"
                  }`}
                >
                  {option.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
