"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/store/hooks";
import { preferencesAPI } from "@/app/lib/api";

export default function TestPartialPreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [partialData, setPartialData] = useState({
    primary_postcode: "SW1A 1AA",
    secondary_location: "",
    commute_location: "",
    commute_time_walk: null,
    commute_time_cycle: null,
    commute_time_tube: null,
    move_in_date: "",
    min_price: null,
    max_price: null,
    min_bedrooms: null,
    max_bedrooms: null,
    property_type: [] as string[],
    building_style: [] as string[],
    lifestyle_features: [] as string[],
  });

  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences();
    }
  }, [isAuthenticated]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      addLog("📥 Loading existing preferences...");
      const response = await preferencesAPI.get();
      setPreferences(response.data);
      addLog(
        `✅ Loaded preferences: ${JSON.stringify(response.data).substring(
          0,
          100
        )}...`
      );

      // Populate partial data with existing values
      if (response.data) {
        setPartialData((prev) => ({
          ...prev,
          ...response.data,
          property_type: response.data.property_type || [],
          building_style: response.data.building_style || [],
          lifestyle_features: response.data.lifestyle_features || [],
        }));
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        addLog("ℹ️ No existing preferences found");
        setPreferences(null);
      } else {
        addLog(`❌ Error loading preferences: ${error?.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const savePartialPreferences = async (step: number) => {
    try {
      setLoading(true);

      // Build partial data based on step
      let dataToSave: any = {};

      switch (step) {
        case 1: // Only location data
          dataToSave = {
            primary_postcode: partialData.primary_postcode,
            secondary_location: partialData.secondary_location,
            commute_location: partialData.commute_location,
          };
          break;
        case 2: // Location + commute times
          dataToSave = {
            primary_postcode: partialData.primary_postcode,
            secondary_location: partialData.secondary_location,
            commute_location: partialData.commute_location,
            commute_time_walk: partialData.commute_time_walk,
            commute_time_cycle: partialData.commute_time_cycle,
            commute_time_tube: partialData.commute_time_tube,
          };
          break;
        case 3: // Location + commute + budget
          dataToSave = {
            primary_postcode: partialData.primary_postcode,
            secondary_location: partialData.secondary_location,
            commute_location: partialData.commute_location,
            commute_time_walk: partialData.commute_time_walk,
            commute_time_cycle: partialData.commute_time_cycle,
            commute_time_tube: partialData.commute_time_tube,
            min_price: partialData.min_price,
            max_price: partialData.max_price,
            min_bedrooms: partialData.min_bedrooms,
            max_bedrooms: partialData.max_bedrooms,
          };
          break;
        case 4: // All including property type
          dataToSave = {
            ...partialData,
          };
          break;
      }

      addLog(
        `📤 Saving partial data (Step ${step}): ${JSON.stringify(
          dataToSave
        ).substring(0, 100)}...`
      );

      const response = preferences
        ? await preferencesAPI.update(dataToSave)
        : await preferencesAPI.create(dataToSave);

      setPreferences(response.data);
      addLog(`✅ Saved successfully! Response: ${response.status}`);
    } catch (error: any) {
      addLog(`❌ Error saving: ${error?.response?.status} - ${error?.message}`);
      if (error?.response?.data) {
        addLog(`📦 Error details: ${JSON.stringify(error.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setPartialData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePropertyType = (type: string) => {
    setPartialData((prev) => ({
      ...prev,
      property_type: prev.property_type.includes(type)
        ? prev.property_type.filter((t) => t !== type)
        : [...prev.property_type, type],
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">
            Test Partial Preferences Save
          </h1>
          <p className="text-red-500">Please login as a tenant first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          Test Partial Preferences Saving
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form Fields */}
          <div className="space-y-4">
            {/* Step 1: Location */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Step 1: Location</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Primary Postcode"
                  value={partialData.primary_postcode}
                  onChange={(e) =>
                    updateField("primary_postcode", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Secondary Location"
                  value={partialData.secondary_location}
                  onChange={(e) =>
                    updateField("secondary_location", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Commute Location"
                  value={partialData.commute_location}
                  onChange={(e) =>
                    updateField("commute_location", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={() => savePartialPreferences(1)}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Save Step 1 Only
                </button>
              </div>
            </div>

            {/* Step 2: Commute Times */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Step 2: Commute Times
              </h2>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Walk time (minutes)"
                  value={partialData.commute_time_walk || ""}
                  onChange={(e) =>
                    updateField(
                      "commute_time_walk",
                      parseInt(e.target.value) || null
                    )
                  }
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Cycle time (minutes)"
                  value={partialData.commute_time_cycle || ""}
                  onChange={(e) =>
                    updateField(
                      "commute_time_cycle",
                      parseInt(e.target.value) || null
                    )
                  }
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Tube time (minutes)"
                  value={partialData.commute_time_tube || ""}
                  onChange={(e) =>
                    updateField(
                      "commute_time_tube",
                      parseInt(e.target.value) || null
                    )
                  }
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={() => savePartialPreferences(2)}
                  disabled={loading}
                  className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  Save Steps 1-2
                </button>
              </div>
            </div>

            {/* Step 3: Budget */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Step 3: Budget</h2>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Min Price (£)"
                  value={partialData.min_price || ""}
                  onChange={(e) =>
                    updateField("min_price", parseInt(e.target.value) || null)
                  }
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Max Price (£)"
                  value={partialData.max_price || ""}
                  onChange={(e) =>
                    updateField("max_price", parseInt(e.target.value) || null)
                  }
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={() => savePartialPreferences(3)}
                  disabled={loading}
                  className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
                >
                  Save Steps 1-3
                </button>
              </div>
            </div>

            {/* Step 4: Property Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Step 4: Property Type
              </h2>
              <div className="space-y-2">
                {["Flat", "House", "Studio", "Room in shared house"].map(
                  (type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={partialData.property_type.includes(type)}
                        onChange={() => togglePropertyType(type)}
                        className="mr-2"
                      />
                      {type}
                    </label>
                  )
                )}
                <button
                  onClick={() => savePartialPreferences(4)}
                  disabled={loading}
                  className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600 disabled:opacity-50 mt-3"
                >
                  Save All Steps (1-4)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Logs and Current Data */}
          <div className="space-y-4">
            {/* Current Preferences */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Current Saved Preferences
              </h2>
              {preferences ? (
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Postcode:</strong>{" "}
                    {preferences.primary_postcode || "Not set"}
                  </p>
                  <p>
                    <strong>Secondary:</strong>{" "}
                    {preferences.secondary_location || "Not set"}
                  </p>
                  <p>
                    <strong>Commute:</strong>{" "}
                    {preferences.commute_location || "Not set"}
                  </p>
                  <p>
                    <strong>Walk time:</strong>{" "}
                    {preferences.commute_time_walk || "Not set"}
                  </p>
                  <p>
                    <strong>Cycle time:</strong>{" "}
                    {preferences.commute_time_cycle || "Not set"}
                  </p>
                  <p>
                    <strong>Tube time:</strong>{" "}
                    {preferences.commute_time_tube || "Not set"}
                  </p>
                  <p>
                    <strong>Price:</strong> £{preferences.min_price || "?"} - £
                    {preferences.max_price || "?"}
                  </p>
                  <p>
                    <strong>Property Type:</strong>{" "}
                    {Array.isArray(preferences.property_type)
                      ? preferences.property_type.join(", ") || "None"
                      : preferences.property_type || "None"}
                  </p>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-blue-600">
                      View Full JSON
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(preferences, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <p className="text-gray-500">No preferences saved yet</p>
              )}
            </div>

            {/* Operation Logs */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Operation Logs</h2>
              <div className="h-64 overflow-y-auto bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500">No operations yet...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Navigation</h2>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/app/preferences")}
                  className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600"
                >
                  Go to Main Preferences Form
                </button>
                <button
                  onClick={loadPreferences}
                  className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Reload Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
