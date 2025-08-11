"use client";

import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/app/store/hooks";
import { preferencesAPI } from "@/app/lib/api";

export default function TestPreferencesCRUDPage() {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    if (isAuthenticated) {
      testGet();
    }
  }, [isAuthenticated]);

  const testGet = async () => {
    try {
      setLoading(true);
      addLog("📥 GET: Fetching preferences...");
      const response = await preferencesAPI.get();
      addLog(`✅ GET: Success - ${response.status}`);
      addLog(`📦 Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
      setPreferences(response.data);
    } catch (error: any) {
      addLog(`❌ GET Error: ${error?.response?.status} - ${error?.message}`);
      if (error?.response?.status === 404) {
        setPreferences(null);
        addLog("ℹ️ No preferences found (404)");
      }
    } finally {
      setLoading(false);
    }
  };

  const testCreate = async () => {
    try {
      setLoading(true);
      const testData = {
        primary_postcode: "SW1A 1AA",
        secondary_location: "Central London",
        commute_location: "Canary Wharf",
        commute_time_walk: 15,
        commute_time_cycle: 20,
        commute_time_tube: 30,
        move_in_date: "2024-06-01",
        min_price: 1500,
        max_price: 3000,
        min_bedrooms: 1,
        max_bedrooms: 2,
        property_type: ["Flat", "Studio"],
        building_style: ["Modern", "New Build"],
        lifestyle_features: ["gym", "pool"],
        social_features: ["communal-space", "events"],
        work_features: ["co-working", "meeting-rooms"],
        furnishing: "furnished",
        designer_furniture: true,
        smoker: false,
        hobbies: ["reading", "cooking"],
        ideal_living_environment: "quiet",
        pets: "cat",
        additional_info: "Test preferences data",
      };

      addLog("📤 CREATE: Sending test data...");
      addLog(`📦 Payload: ${JSON.stringify(testData).substring(0, 100)}...`);

      const response = await preferencesAPI.create(testData);

      addLog(`✅ CREATE: Success - ${response.status}`);
      addLog(
        `📦 Response: ${JSON.stringify(response.data).substring(0, 100)}...`
      );
      setPreferences(response.data);
    } catch (error: any) {
      addLog(`❌ CREATE Error: ${error?.response?.status} - ${error?.message}`);
      addLog(`📦 Error details: ${JSON.stringify(error?.response?.data)}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpdate = async () => {
    try {
      setLoading(true);
      const updateData = {
        primary_postcode: "W1A 1AA",
        commute_location: "Westminster",
        min_price: 2000,
        max_price: 4000,
        property_type: ["House", "Flat", "Room in shared house"],
        lifestyle_features: ["gym", "pool", "spa"],
        additional_info: "Updated preferences " + new Date().toISOString(),
      };

      addLog("📤 UPDATE: Sending update data...");
      addLog(`📦 Payload: ${JSON.stringify(updateData).substring(0, 100)}...`);

      const response = await preferencesAPI.update(updateData);

      addLog(`✅ UPDATE: Success - ${response.status}`);
      addLog(
        `📦 Response: ${JSON.stringify(response.data).substring(0, 100)}...`
      );
      setPreferences(response.data);
    } catch (error: any) {
      addLog(`❌ UPDATE Error: ${error?.response?.status} - ${error?.message}`);
      addLog(`📦 Error details: ${JSON.stringify(error?.response?.data)}`);
    } finally {
      setLoading(false);
    }
  };

  const testDelete = async () => {
    try {
      setLoading(true);
      addLog("🗑️ DELETE: Deleting preferences...");

      const response = await preferencesAPI.delete();

      addLog(`✅ DELETE: Success - ${response.status}`);
      setPreferences(null);
    } catch (error: any) {
      addLog(`❌ DELETE Error: ${error?.response?.status} - ${error?.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Test Preferences CRUD</h1>
          <p className="text-red-500">Please login as a tenant first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          Test Preferences CRUD Operations
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls and User Info */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">User Info</h2>
              <p className="text-sm">Email: {user?.email}</p>
              <p className="text-sm">Role: {user?.role}</p>
              <p className="text-sm">ID: {user?.id}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">CRUD Operations</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={testGet}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  GET (Read)
                </button>
                <button
                  onClick={testCreate}
                  disabled={loading || preferences}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  POST (Create)
                </button>
                <button
                  onClick={testUpdate}
                  disabled={loading || !preferences}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
                >
                  PUT (Update)
                </button>
                <button
                  onClick={testDelete}
                  disabled={loading || !preferences}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                >
                  DELETE
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Create is disabled if preferences exist. Update/Delete are
                disabled if no preferences.
              </p>
            </div>

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
          </div>

          {/* Right Column - Current Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Current Preferences Data
            </h2>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : preferences ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <strong>Primary Postcode:</strong>
                    <p className="text-gray-600">
                      {preferences.primary_postcode || "Not set"}
                    </p>
                  </div>
                  <div>
                    <strong>Secondary Location:</strong>
                    <p className="text-gray-600">
                      {preferences.secondary_location || "Not set"}
                    </p>
                  </div>
                  <div>
                    <strong>Commute Location:</strong>
                    <p className="text-gray-600">
                      {preferences.commute_location || "Not set"}
                    </p>
                  </div>
                  <div>
                    <strong>Move-in Date:</strong>
                    <p className="text-gray-600">
                      {preferences.move_in_date || "Not set"}
                    </p>
                  </div>
                  <div>
                    <strong>Price Range:</strong>
                    <p className="text-gray-600">
                      £{preferences.min_price || "?"} - £
                      {preferences.max_price || "?"}
                    </p>
                  </div>
                  <div>
                    <strong>Bedrooms:</strong>
                    <p className="text-gray-600">
                      {preferences.min_bedrooms || "?"} -{" "}
                      {preferences.max_bedrooms || "?"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <strong>Property Types:</strong>
                    <p className="text-gray-600">
                      {Array.isArray(preferences.property_type)
                        ? preferences.property_type.join(", ") || "None"
                        : preferences.property_type || "None"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <strong>Building Style:</strong>
                    <p className="text-gray-600">
                      {Array.isArray(preferences.building_style)
                        ? preferences.building_style.join(", ") || "None"
                        : "None"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <strong>Lifestyle Features:</strong>
                    <p className="text-gray-600">
                      {Array.isArray(preferences.lifestyle_features)
                        ? preferences.lifestyle_features.join(", ") || "None"
                        : "None"}
                    </p>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600 text-sm">
                    View Full JSON Response
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(preferences, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No preferences saved yet</p>
                <button
                  onClick={testCreate}
                  className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                >
                  Create Test Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
