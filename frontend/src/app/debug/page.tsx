"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";
import { authAPI } from "../lib/api";

export default function DebugPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [apiStatus, setApiStatus] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const checkAPI = async () => {
    setLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      frontend: {
        url: window.location.href,
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
        nodeEnv: process.env.NODE_ENV,
      },
      localStorage: {
        hasToken: !!localStorage.getItem("accessToken"),
        tokenPrefix: localStorage.getItem("accessToken")?.substring(0, 20),
        sessionExpiry: localStorage.getItem("sessionExpiry"),
      },
      redux: {
        isAuthenticated,
        hasUser: !!user,
        userEmail: user?.email,
        userRole: user?.role,
        userProvider: user?.provider,
      },
    };

    // Test API connectivity
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/health`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      results.apiHealth = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (response.ok) {
        try {
          const data = await response.json();
          results.apiHealth.data = data;
        } catch (e) {
          results.apiHealth.data = await response.text();
        }
      }
    } catch (error: any) {
      results.apiHealth = {
        error: error.message,
        name: error.name,
        stack: error.stack,
      };
    }

    // Test auth endpoint if we have a token
    if (localStorage.getItem("accessToken")) {
      try {
        const authResponse = await authAPI.getProfile();
        results.authTest = {
          success: true,
          user: authResponse.user,
        };
      } catch (error: any) {
        results.authTest = {
          success: false,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        };
      }
    }

    setApiStatus(results);
    setLoading(false);
  };

  useEffect(() => {
    checkAPI();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Debug Dashboard
            </h1>
            <button
              onClick={checkAPI}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Refresh"}
            </button>
          </div>

          {apiStatus.timestamp && (
            <div className="space-y-6">
              {/* System Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  System Information
                </h3>
                <div className="bg-gray-100 p-4 rounded">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(apiStatus.frontend, null, 2)}
                  </pre>
                </div>
              </div>

              {/* API Health */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  API Health Check
                </h3>
                <div
                  className={`p-4 rounded ${
                    apiStatus.apiHealth?.ok ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(apiStatus.apiHealth, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Auth State */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Authentication State
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Redux State</h4>
                    <div className="bg-gray-100 p-3 rounded">
                      <pre className="text-sm">
                        {JSON.stringify(apiStatus.redux, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">LocalStorage</h4>
                    <div className="bg-gray-100 p-3 rounded">
                      <pre className="text-sm">
                        {JSON.stringify(apiStatus.localStorage, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auth Test */}
              {apiStatus.authTest && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Auth Endpoint Test
                  </h3>
                  <div
                    className={`p-4 rounded ${
                      apiStatus.authTest.success ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(apiStatus.authTest, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      localStorage.removeItem("accessToken");
                      localStorage.removeItem("sessionExpiry");
                      window.location.reload();
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Clear Auth & Reload
                  </button>

                  <button
                    onClick={() => {
                      window.location.href = "/";
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Go Home
                  </button>

                  <button
                    onClick={() => {
                      console.log("🔍 Debug data:", apiStatus);
                      alert("Debug data logged to console");
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Log to Console
                  </button>

                  <button
                    onClick={() => {
                      const debugData = JSON.stringify(apiStatus, null, 2);
                      navigator.clipboard.writeText(debugData);
                      alert("Debug data copied to clipboard");
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Copy Debug Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
