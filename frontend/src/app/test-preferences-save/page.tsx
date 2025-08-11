"use client";

import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/app/store/hooks";
import { preferencesAPI } from "@/app/lib/api";

export default function TestPreferencesSavePage() {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences();
    }
  }, [isAuthenticated]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await preferencesAPI.get();
      setPreferences(response.data);
      console.log("Loaded preferences:", response.data);
    } catch (error: any) {
      console.error("Error loading preferences:", error);
      if (error?.response?.status === 404) {
        setPreferences(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const testSavePreferences = async () => {
    try {
      setSaveStatus("Saving...");
      const testData = {
        primary_postcode: "SW1A 1AA",
        secondary_location: "Central London",
        commute_location: "Canary Wharf",
        commute_time_walk: 15,
        commute_time_cycle: 20,
        commute_time_tube: 30,
        min_price: 1500,
        max_price: 3000,
        min_bedrooms: 1,
        max_bedrooms: 2,
        property_type: ["Flat", "Studio"], // Now an array
        building_style: ["Modern", "New Build"],
        lifestyle_features: ["gym", "pool"],
        furnishing: "furnished",
      };

      const response = preferences
        ? await preferencesAPI.update(testData)
        : await preferencesAPI.create(testData);

      console.log("Save response:", response.data);
      setSaveStatus("✅ Preferences saved successfully!");

      // Reload to verify
      setTimeout(() => {
        loadPreferences();
      }, 1000);
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      setSaveStatus(
        `❌ Error: ${error?.response?.data?.message || error.message}`
      );
    }
  };

  const clearPreferences = async () => {
    try {
      setSaveStatus("Clearing...");
      await preferencesAPI.delete();
      setSaveStatus("✅ Preferences cleared!");
      setPreferences(null);
    } catch (error: any) {
      console.error("Error clearing preferences:", error);
      setSaveStatus(
        `❌ Error: ${error?.response?.data?.message || error.message}`
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Test Preferences Save</h1>
          <p className="text-red-500">Please login first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Preferences Save</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">User Info</h2>
          <p>Email: {user?.email}</p>
          <p>Role: {user?.role}</p>
          <p>ID: {user?.id}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={testSavePreferences}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Save Preferences
            </button>
            <button
              onClick={loadPreferences}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Reload Preferences
            </button>
            <button
              onClick={clearPreferences}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear Preferences
            </button>
          </div>
          {saveStatus && <p className="mt-4 text-sm">{saveStatus}</p>}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Current Preferences</h2>
          {loading ? (
            <p>Loading...</p>
          ) : preferences ? (
            <div className="space-y-2">
              <div className="text-sm">
                <p>
                  <strong>Primary Postcode:</strong>{" "}
                  {preferences.primary_postcode || "Not set"}
                </p>
                <p>
                  <strong>Secondary Location:</strong>{" "}
                  {preferences.secondary_location || "Not set"}
                </p>
                <p>
                  <strong>Commute Location:</strong>{" "}
                  {preferences.commute_location || "Not set"}
                </p>
                <p>
                  <strong>Property Type:</strong>{" "}
                  {Array.isArray(preferences.property_type)
                    ? preferences.property_type.join(", ") || "Not set"
                    : preferences.property_type || "Not set"}
                </p>
                <p>
                  <strong>Building Style:</strong>{" "}
                  {Array.isArray(preferences.building_style)
                    ? preferences.building_style.join(", ") || "Not set"
                    : "Not set"}
                </p>
                <p>
                  <strong>Min Price:</strong> £
                  {preferences.min_price || "Not set"}
                </p>
                <p>
                  <strong>Max Price:</strong> £
                  {preferences.max_price || "Not set"}
                </p>
                <p>
                  <strong>Min Bedrooms:</strong>{" "}
                  {preferences.min_bedrooms || "Not set"}
                </p>
                <p>
                  <strong>Max Bedrooms:</strong>{" "}
                  {preferences.max_bedrooms || "Not set"}
                </p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600">
                    View Full JSON
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(preferences, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No preferences saved yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
