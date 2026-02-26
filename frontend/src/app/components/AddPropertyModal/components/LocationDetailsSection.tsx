import React from "react";
import { Minus } from "lucide-react";
import { PropertyFormData, MetroStation, CommuteTime, LocalEssential } from "../types";

interface LocationDetailsSectionProps {
  formData: PropertyFormData;
  onFieldChange: (field: string, value: any) => void;
  addMetroStation: () => void;
  updateMetroStation: (index: number, updates: Partial<MetroStation>) => void;
  removeMetroStation: (index: number) => void;
  addCommuteTime: () => void;
  updateCommuteTime: (index: number, updates: Partial<CommuteTime>) => void;
  removeCommuteTime: (index: number) => void;
  addLocalEssential: () => void;
  updateLocalEssential: (index: number, updates: Partial<LocalEssential>) => void;
  removeLocalEssential: (index: number) => void;
}

export const LocationDetailsSection: React.FC<LocationDetailsSectionProps> = ({
  formData,
  onFieldChange,
  addMetroStation,
  updateMetroStation,
  removeMetroStation,
  addCommuteTime,
  updateCommuteTime,
  removeCommuteTime,
  addLocalEssential,
  updateLocalEssential,
  removeLocalEssential,
}) => {
  return (
    <div className="space-y-6">
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
                updateMetroStation(index, { label: e.target.value })
              }
              className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50"
              placeholder="Station name"
            />
            <input
              type="number"
              value={station.destination ?? ""}
              onChange={(e) => {
                const inputVal = e.target.value;
                if (inputVal === "") {
                  updateMetroStation(index, { destination: undefined });
                } else {
                  updateMetroStation(index, {
                    destination: Math.max(0, parseInt(inputVal, 10) || 0),
                  });
                }
              }}
              className="w-24 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="min"
              min={0}
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
          className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
        >
          Add Metro Station
        </button>
      </div>

      {/* Commute Times */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
          Commute Times
        </h4>
        {formData.commute_times.map((time, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={time.label}
              onChange={(e) =>
                updateCommuteTime(index, { label: e.target.value })
              }
              className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50"
              placeholder="Destination"
            />
            <input
              type="number"
              value={time.destination ?? ""}
              onChange={(e) => {
                const inputVal = e.target.value;
                if (inputVal === "") {
                  updateCommuteTime(index, { destination: undefined });
                } else {
                  updateCommuteTime(index, {
                    destination: Math.max(0, parseInt(inputVal, 10) || 0),
                  });
                }
              }}
              className="w-24 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="min"
              min={0}
            />
            <button
              type="button"
              onClick={() => removeCommuteTime(index)}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addCommuteTime}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
        >
          Add Commute Time
        </button>
      </div>

      {/* Local Essentials */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-white border-b border-white/10 pb-2">
          Local Essentials
        </h4>
        {formData.local_essentials.map((essential, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={essential.label}
              onChange={(e) =>
                updateLocalEssential(index, { label: e.target.value })
              }
              className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50"
              placeholder="Essential name"
            />
            <input
              type="number"
              value={essential.destination ?? ""}
              onChange={(e) => {
                const inputVal = e.target.value;
                if (inputVal === "") {
                  updateLocalEssential(index, { destination: undefined });
                } else {
                  updateLocalEssential(index, {
                    destination: Math.max(0, parseInt(inputVal, 10) || 0),
                  });
                }
              }}
              className="w-24 px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="min"
              min={0}
            />
            <button
              type="button"
              onClick={() => removeLocalEssential(index)}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addLocalEssential}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
        >
          Add Local Essential
        </button>
      </div>
    </div>
  );
};
