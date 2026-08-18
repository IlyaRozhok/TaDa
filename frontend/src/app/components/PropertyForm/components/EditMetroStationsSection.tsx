import React from "react";
import { Minus } from "lucide-react";
import type { EditPropertyFormData } from "../types";
import type { MetroStation } from "../types";

interface EditMetroStationsSectionProps {
  formData: EditPropertyFormData;
  addMetroStation: () => void;
  updateMetroStation: (
    index: number,
    field: keyof MetroStation,
    value: string | number | undefined,
  ) => void;
  removeMetroStation: (index: number) => void;
}

export const EditMetroStationsSection: React.FC<
  EditMetroStationsSectionProps
> = ({ formData, addMetroStation, updateMetroStation, removeMetroStation }) => {
  return (
    <>
          {/* Metro Stations */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
              Metro Stations
            </h4>

            {formData.metro_stations.map((station, index) => (
              <div key={index} className="flex gap-2">
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
                />
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
    </>
  );
};
