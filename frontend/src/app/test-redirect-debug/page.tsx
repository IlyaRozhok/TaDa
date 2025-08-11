"use client";

import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/app/store/hooks";
import { useRouter } from "next/navigation";

export default function TestRedirectDebugPage() {
  const router = useRouter();
  const authState = useAppSelector((state) => state.auth);
  const [logs, setLogs] = useState<string[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  useEffect(() => {
    // Log initial state
    addLog(`Page loaded at: ${window.location.pathname}`);
    addLog(`isAuthenticated: ${authState.isAuthenticated}`);
    addLog(`User: ${authState.user?.email || "none"}`);
    addLog(`Role: ${authState.user?.role || "none"}`);
  }, []);

  useEffect(() => {
    // Track navigation
    const handleRouteChange = () => {
      const newPath = window.location.pathname;
      setNavigationHistory((prev) => [...prev, newPath].slice(-10));
      addLog(`Navigation to: ${newPath}`);
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener("popstate", handleRouteChange);

    // Override router.push to track programmatic navigation
    const originalPush = router.push;
    (router as any).push = (url: string, ...args: any[]) => {
      addLog(`router.push called: ${url}`);
      return originalPush.call(router, url, ...args);
    };

    // Override router.replace
    const originalReplace = router.replace;
    (router as any).replace = (url: string, ...args: any[]) => {
      addLog(`router.replace called: ${url}`);
      return originalReplace.call(router, url, ...args);
    };

    // Override window.location.href setter
    const originalHref = Object.getOwnPropertyDescriptor(
      window.location,
      "href"
    );
    if (originalHref) {
      Object.defineProperty(window.location, "href", {
        set: function (value) {
          addLog(`window.location.href set to: ${value}`);
          if (originalHref.set) {
            originalHref.set.call(window.location, value);
          }
        },
        get: originalHref.get,
        enumerable: originalHref.enumerable,
        configurable: originalHref.configurable,
      });
    }

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      // Restore original methods
      (router as any).push = originalPush;
      (router as any).replace = originalReplace;
      if (originalHref) {
        Object.defineProperty(window.location, "href", originalHref);
      }
    };
  }, [router]);

  useEffect(() => {
    // Track auth state changes
    addLog(
      `Auth state changed: isAuthenticated=${authState.isAuthenticated}, user=${authState.user?.email}`
    );
  }, [authState.isAuthenticated, authState.user]);

  const testPreferencesSave = async () => {
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

      // Wait to see what happens after save
      setTimeout(() => {
        addLog(
          `5 seconds after save - current path: ${window.location.pathname}`
        );
        addLog(
          `5 seconds after save - isAuthenticated: ${authState.isAuthenticated}`
        );
      }, 5000);
    } catch (error: any) {
      addLog(`Exception: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Redirect Debug Page</h1>
        <p className="text-sm text-gray-600 mb-4">
          This page tracks all navigation and redirects to help debug the issue.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Current State */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Current State</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Current Path:</strong>{" "}
                  {typeof window !== "undefined"
                    ? window.location.pathname
                    : "..."}
                </p>
                <p>
                  <strong>isAuthenticated:</strong>{" "}
                  {authState.isAuthenticated ? "✅ Yes" : "❌ No"}
                </p>
                <p>
                  <strong>User:</strong> {authState.user?.email || "None"}
                </p>
                <p>
                  <strong>Role:</strong> {authState.user?.role || "None"}
                </p>
                <p>
                  <strong>Token:</strong>{" "}
                  {authState.accessToken ? "Present" : "None"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Navigation History</h2>
              <div className="space-y-1 text-sm font-mono">
                {navigationHistory.length === 0 ? (
                  <p className="text-gray-500">No navigation yet</p>
                ) : (
                  navigationHistory.map((path, index) => (
                    <div key={index} className="text-gray-700">
                      {index + 1}. {path}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={testPreferencesSave}
                  className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                >
                  Test Save Preferences
                </button>
                <button
                  onClick={() => router.push("/app/preferences")}
                  className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  Go to Preferences
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
            <h2 className="text-lg font-semibold mb-4">
              Debug Logs (All Redirects)
            </h2>
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
