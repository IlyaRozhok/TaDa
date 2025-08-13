import React from "react";
import { MapPin } from "lucide-react";
import { InputField, MetroDropdown, LocationDropdown } from "../ui";
import { DateRangePicker } from "../ui/DateRangePicker";
import { PreferencesStepProps } from "@/app/types/preferences";
import {
  SECONDARY_LOCATION_OPTIONS,
  COMMUTE_LOCATION_OPTIONS,
} from "@/app/constants/preferences";

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

        <MetroDropdown
          label="Secondary Location"
          value={formData.secondary_location || "no-preference"}
          options={SECONDARY_LOCATION_OPTIONS}
          onChange={(value) => onUpdate("secondary_location", value)}
          placeholder="No Preference"
          error={errors.secondary_location}
        />

        <LocationDropdown
          label="Commute Location"
          value={formData.commute_location || "no-preference"}
          options={COMMUTE_LOCATION_OPTIONS}
          onChange={(value) => onUpdate("commute_location", value)}
          placeholder="No Preference"
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
            // Only set move_out_date if it's different from move_in_date (range selection)
            onUpdate(
              "move_out_date",
              range.start === range.end ? null : range.end
            );
          }}
          error={errors.move_in_date}
          placeholder="May 1 - May 2"
        />
      </div>
    </section>
  );
};
