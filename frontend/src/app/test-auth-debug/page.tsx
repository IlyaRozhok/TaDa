"use client";

import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/app/store/hooks";

export default function TestAuthDebugPage() {
  const authState = useAppSelector((state) => state.auth);
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    // Update localStorage data
    const updateLocalStorage = () => {
      setLocalStorageData({
        accessToken: localStorage.getItem("accessToken"),
        sessionExpiry: localStorage.getItem("sessionExpiry"),
        sessionManagerInitialized: window.__sessionManagerInitialized,
      });
    };

    updateLocalStorage();
    const interval = setInterval(updateLocalStorage, 1000);

    // Monitor auth state changes
    addLog("Page loaded");

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    addLog(
      `Auth state changed: isAuthenticated=${authState.isAuthenticated}, user=${authState.user?.email}`
    );
  }, [authState.isAuthenticated, authState.user]);

  const testSavePreferences = async () => {
    try {
      addLog("Starting preferences save test...");

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
        }/preferences`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            primary_postcode: "SW1A 1AA",
            min_price: 1000,
            max_price: 3000,
          }),
        }
      );

      addLog(`Preferences save response: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        addLog(`Error: ${error}`);
      } else {
        const data = await response.json();
        addLog(`Success: ${JSON.stringify(data).substring(0, 100)}...`);
      }
    } catch (error: any) {
      addLog(`Exception: ${error.message}`);
    }
  };

  const checkAuth = async () => {
    try {
      addLog("Checking auth status...");

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
        }/auth/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      addLog(`Auth check response: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        addLog(`Error: ${error}`);
      } else {
        const data = await response.json();
        addLog(`User: ${data.user?.email}`);
      }
    } catch (error: any) {
      addLog(`Exception: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Current State */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Redux Auth State</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>isAuthenticated:</strong>{" "}
                  {authState.isAuthenticated ? "✅ Yes" : "❌ No"}
                </p>
                <p>
                  <strong>User:</strong> {authState.user?.email || "None"}
                </p>
                <p>
                  <strong>User ID:</strong> {authState.user?.id || "None"}
                </p>
                <p>
                  <strong>Role:</strong> {authState.user?.role || "None"}
                </p>
                <p>
                  <strong>Token:</strong>{" "}
                  {authState.accessToken
                    ? authState.accessToken.substring(0, 20) + "..."
                    : "None"}
                </p>
                <p>
                  <strong>Session Expiry:</strong>{" "}
                  {authState.sessionExpiry
                    ? new Date(authState.sessionExpiry).toLocaleString()
                    : "None"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">LocalStorage</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>accessToken:</strong>{" "}
                  {localStorageData.accessToken
                    ? localStorageData.accessToken.substring(0, 20) + "..."
                    : "None"}
                </p>
                <p>
                  <strong>sessionExpiry:</strong>{" "}
                  {localStorageData.sessionExpiry
                    ? new Date(
                        parseInt(localStorageData.sessionExpiry)
                      ).toLocaleString()
                    : "None"}
                </p>
                <p>
                  <strong>sessionManagerInitialized:</strong>{" "}
                  {localStorageData.sessionManagerInitialized
                    ? "✅ Yes"
                    : "❌ No"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={checkAuth}
                  className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  Check Auth Status
                </button>
                <button
                  onClick={testSavePreferences}
                  className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                >
                  Test Save Preferences
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Logs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>
            <div className="h-96 overflow-y-auto bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet...</p>
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
      </div>
    </div>
  );
}
