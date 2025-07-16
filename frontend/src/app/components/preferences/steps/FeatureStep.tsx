import React from "react";
import { FeatureSelector } from "../ui";
import {
  PreferencesStepProps,
  PreferencesOption,
} from "@/app/types/preferences";

interface FeatureStepProps extends PreferencesStepProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  options: readonly PreferencesOption[];
  featureKey: keyof PreferencesStepProps["formData"];
  onToggle: (feature: string) => void;
}

export const FeatureStep: React.FC<FeatureStepProps> = ({
  title,
  description,
  icon: Icon,
  color,
  options,
  featureKey,
  formData,
  onToggle,
}) => {
  const selectedFeatures = (formData[featureKey] as string[]) || [];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    pink: "bg-pink-100 text-pink-600",
    orange: "bg-orange-100 text-orange-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-center mb-6">
        <div
          className={`w-10 h-10 ${
            colorClasses[color] || colorClasses.blue
          } rounded-lg flex items-center justify-center mr-4`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-black">{title}</h2>
          <p className="text-black text-sm">{description}</p>
        </div>
      </div>

      <FeatureSelector
        title={title}
        options={options}
        category={featureKey}
        icon={Icon}
        selectedFeatures={selectedFeatures}
        onToggle={onToggle}
      />
    </section>
  );
};
