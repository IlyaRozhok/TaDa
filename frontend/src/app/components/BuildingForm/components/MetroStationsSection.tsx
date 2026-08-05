import React from "react";
import { Minus } from "lucide-react";
import type { BuildingFormData, MetroStation } from "../types";

interface MetroStationsSectionProps {
  formData: BuildingFormData;
  addMetroStation: () => void;
  updateMetroStation: (
    index: number,
    field: keyof MetroStation,
    value: string | number | undefined,
  ) => void;
  removeMetroStation: (index: number) => void;
  mode: "create" | "edit";
}

/**
 * The two monoliths disagreed on the station rows and the difference is
 * kept on purpose: create marks both inputs `required` and lets the minutes
 * field go empty; edit has no `required` and coerces empty minutes to 0.
 */
export const MetroStationsSection: React.FC<MetroStationsSectionProps> = ({
  formData,
  addMetroStation,
  updateMetroStation,
  removeMetroStation,
  mode,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
        Metro Stations
      </h4>

      {formData.metro_stations.map((station, index) => (
        <div key={index} className="flex gap-2">
          {mode === "edit" ? (
            <>
              <input
                type="text"
                value={station.label}
                onChange={(e) =>
                  updateMetroStation(index, "label", e.target.value)
                }
                className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                placeholder="Station name"
              />
              <input
                type="number"
                value={station.destination}
                onChange={(e) =>
                  updateMetroStation(
                    index,
                    "destination",
                    parseInt(e.target.value) || 0,
                  )
                }
                className="w-24 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                placeholder="min"
                min="0"
              />
            </>
          ) : (
            <>
              <input
                type="text"
                value={station.label}
                onChange={(e) =>
                  updateMetroStation(index, "label", e.target.value)
                }
                className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
                placeholder="Station name"
                required
              />
              <input
                type="number"
                value={station.destination ?? ""}
                onChange={(e) => {
                  const inputVal = e.target.value;
                  if (inputVal === "") {
                    updateMetroStation(index, "destination", undefined);
                  } else {
                    const val = Math.max(0, parseInt(inputVal) || 0);
                    updateMetroStation(index, "destination", val);
                  }
                }}
                className="w-24 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                placeholder="min"
                min="0"
                required
              />
            </>
          )}
          <button
            type="button"
            onClick={() => removeMetroStation(index)}
            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addMetroStation}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200"
      >
        Add Metro Station
      </button>
    </div>
  );
};
