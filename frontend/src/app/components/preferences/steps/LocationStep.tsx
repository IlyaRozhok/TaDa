import React from "react";
import { MapPin } from "lucide-react";
import { InputField } from "../ui";
import { PreferencesStepProps } from "@/app/types/preferences";

export const LocationStep: React.FC<PreferencesStepProps> = ({
  formData,
  errors,
  onUpdate,
}) => {
  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
          <MapPin className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Location & Commute
          </h2>
          <p className="text-slate-600 text-sm">
            Where you want to live and work
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Primary Postcode"
          tooltip="Your preferred area or postcode for living"
          placeholder="e.g., SW1A 1AA"
          value={formData.primary_postcode || ""}
          onChange={(e) => onUpdate("primary_postcode", e.target.value)}
          error={errors.primary_postcode}
        />

        <InputField
          label="Secondary Location"
          tooltip="Alternative area you'd consider"
          placeholder="e.g., Central London"
          value={formData.secondary_location || ""}
          onChange={(e) => onUpdate("secondary_location", e.target.value)}
          error={errors.secondary_location}
        />

        <InputField
          label="Commute Location"
          tooltip="Where you commute to for work"
          placeholder="e.g., Canary Wharf"
          value={formData.commute_location || ""}
          onChange={(e) => onUpdate("commute_location", e.target.value)}
          error={errors.commute_location}
        />

        <InputField
          label="Move-in Date"
          tooltip="When you want to move in"
          type="date"
          value={formData.move_in_date || ""}
          onChange={(e) => onUpdate("move_in_date", e.target.value)}
          error={errors.move_in_date}
        />
      </div>

      <div className="bg-slate-50 rounded-xl p-6 mt-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Maximum Commute Times
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Walking (minutes)"
            tooltip="Maximum walking time to work or transport"
            type="number"
            min="1"
            max="120"
            placeholder="15"
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
            placeholder="20"
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
            label="Tube (minutes)"
            tooltip="Maximum tube/public transport time"
            type="number"
            min="1"
            max="120"
            placeholder="30"
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
      </div>
    </section>
  );
};
