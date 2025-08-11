import React from "react";
import { Clock } from "lucide-react";
import { InputField } from "../ui";
import { PreferencesStepProps } from "@/app/types/preferences";

export const CommuteTimeStep: React.FC<PreferencesStepProps> = ({
  formData,
  errors,
  onUpdate,
}) => {
  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
          <Clock className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Maximum Commute Time
          </h2>
          <p className="text-slate-600 text-sm">
            How long are you willing to commute?
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Commute Time Preferences
        </h3>
        <p className="text-slate-600 text-sm mb-6">
          Set your maximum acceptable commute times for different transport
          methods
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Walking (minutes)"
            tooltip="Maximum walking time to work or transport"
            type="number"
            min="1"
            max="120"
            value={formData.commute_time_walk || ""}
            onChange={(e) =>
              onUpdate(
                "commute_time_walk",
                parseInt(e.target.value) || undefined
              )
            }
            error={errors.commute_time_walk}
          />

          <InputField
            label="Cycling (minutes)"
            tooltip="Maximum cycling time to work"
            type="number"
            min="1"
            max="120"
            value={formData.commute_time_cycle || ""}
            onChange={(e) =>
              onUpdate(
                "commute_time_cycle",
                parseInt(e.target.value) || undefined
              )
            }
            error={errors.commute_time_cycle}
          />

          <InputField
            label="Tube/Public Transport (minutes)"
            tooltip="Maximum tube or public transport time"
            type="number"
            min="1"
            max="120"
            value={formData.commute_time_tube || ""}
            onChange={(e) =>
              onUpdate(
                "commute_time_tube",
                parseInt(e.target.value) || undefined
              )
            }
            error={errors.commute_time_tube}
          />
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Properties matching your commute preferences
            will be prioritized in search results.
          </p>
        </div>
      </div>
    </section>
  );
};
