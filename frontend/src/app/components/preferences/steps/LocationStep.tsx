import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { InputField } from "../ui";
import { DateRangePicker } from "../ui/DateRangePicker";
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
            Where you want to live and commute to
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Primary Postcode"
          tooltip="Your preferred area or postcode for living"
          value={formData.primary_postcode || ""}
          onChange={(e) => onUpdate("primary_postcode", e.target.value)}
          error={errors.primary_postcode}
        />

        <InputField
          label="Secondary Location"
          tooltip="Alternative area you'd consider"
          value={formData.secondary_location || ""}
          onChange={(e) => onUpdate("secondary_location", e.target.value)}
          error={errors.secondary_location}
        />

        <InputField
          label="Commute Location"
          tooltip="Where you commute to for work"
          value={formData.commute_location || ""}
          onChange={(e) => onUpdate("commute_location", e.target.value)}
          error={errors.commute_location}
        />

        <DateRangePicker
          label="Move-in Date"
          value={{
            start: formData.move_in_date || null,
            end: formData.move_out_date || null,
          }}
          onChange={(range) => {
            onUpdate("move_in_date", range.start);
            onUpdate("move_out_date", range.end);
          }}
          error={errors.move_in_date}
          placeholder="May 1 - May 2"
        />
      </div>
    </section>
  );
};
