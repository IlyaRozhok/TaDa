"use client";

import React from "react";
import {
  LIFESTYLE_FEATURES,
  LifestyleFeature,
} from "../constants/lifestyleFeatures";

interface LifestyleFeaturesSelectorProps {
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  className?: string;
}

export default function LifestyleFeaturesSelector({
  selectedFeatures,
  onFeaturesChange,
  className = "",
}: LifestyleFeaturesSelectorProps) {
  const handleFeatureToggle = (featureId: string) => {
    const newFeatures = selectedFeatures.includes(featureId)
      ? selectedFeatures.filter((id) => id !== featureId)
      : [...selectedFeatures, featureId];
    onFeaturesChange(newFeatures);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold mb-3">Lifestyle Features</h3>
        <p className="text-gray-600 text-sm mb-4">
          Select the features available in this property
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {LIFESTYLE_FEATURES.map((feature) => {
          const Icon = feature.icon;
          const isSelected = selectedFeatures.includes(feature.id);

          return (
            <button
              key={feature.id}
              type="button"
              onClick={() => handleFeatureToggle(feature.id)}
              className={`
                flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200
                ${
                  isSelected
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{feature.label}</span>
            </button>
          );
        })}
      </div>

      {selectedFeatures.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Selected features:</strong> {selectedFeatures.length}
          </p>
        </div>
      )}
    </div>
  );
}
