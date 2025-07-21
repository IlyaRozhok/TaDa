"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/slices/authSlice";
import GlobalLoader from "../../components/GlobalLoader";

function SelectRoleContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempTokenInfo, setTempTokenInfo] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<
    "tenant" | "operator" | null
  >(null);

  const tempToken = searchParams.get("tempToken");

  useEffect(() => {
    const fetchTempTokenInfo = async () => {
      if (!tempToken) {
        setError("No temporary token provided");
        return;
      }

      try {
        console.log(
          "🔍 Fetching temp token info for:",
          tempToken.substring(0, 20) + "..."
        );

        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
          }/auth/temp-token/${tempToken}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch token info: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Temp token info received:", {
          hasData: !!data,
          email: data?.googleUserData?.email,
          expires: data?.expiresAt,
        });

        setTempTokenInfo(data);
      } catch (error: any) {
        console.error("❌ Failed to fetch temp token info:", error);
        setError("Invalid or expired session. Please try logging in again.");
      }
    };

    fetchTempTokenInfo();
  }, [tempToken]);

  const handleRoleSelection = async (role: "tenant" | "operator") => {
    if (!tempToken) {
      setError("No temporary token available");
      return;
    }

    setLoading(true);
    setSelectedRole(role);
    setError(null);

    try {
      console.log("🔄 Creating user with role:", role);

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
        }/auth/create-google-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tempToken: tempToken,
            role: role,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to create user: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("✅ User created successfully:", {
        hasUser: !!result.user,
        hasTokens: !!result.tokens,
        userEmail: result.user?.email,
        userRole: result.user?.role,
      });

      // Store authentication tokens
      if (result.tokens?.access_token) {
        localStorage.setItem("accessToken", result.tokens.access_token);
        localStorage.setItem(
          "sessionExpiry",
          String(Date.now() + 24 * 60 * 60 * 1000)
        );

        // Update Redux store
        dispatch(
          setCredentials({
            user: result.user,
            accessToken: result.tokens.access_token,
          })
        );

        console.log("🔄 Redirecting to dashboard for role:", role);

        // Redirect based on role
        setTimeout(() => {
          if (role === "admin") {
            router.replace("/app/admin/panel");
          } else if (role === "operator") {
            router.replace("/app/dashboard/operator");
          } else if (role === "tenant") {
            router.replace("/app/dashboard/tenant");
          } else {
            router.replace("/app/dashboard");
          }
        }, 100);
      } else {
        throw new Error("No authentication tokens received");
      }
    } catch (error: any) {
      console.error("❌ Role selection error:", error);
      setError(error.message || "Failed to complete registration");
      setSelectedRole(null);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Session Error
            </h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tempTokenInfo) {
    return <GlobalLoader isLoading={true} message="Loading session..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Choose Your Role
          </h1>
          <p className="text-gray-600 mb-2">
            Welcome, {tempTokenInfo.googleUserData?.full_name}!
          </p>
          <p className="text-sm text-gray-500">
            Select how you'll be using our platform:
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {/* Tenant Role */}
          <div
            onClick={() => !loading && handleRoleSelection("tenant")}
            className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
              loading && selectedRole === "tenant"
                ? "border-blue-500 bg-blue-50 cursor-wait"
                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
            } ${loading ? "pointer-events-none opacity-75" : ""}`}
          >
            {loading && selectedRole === "tenant" && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-xl">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m9 12 2 2 4-4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  I'm Looking for Housing
                </h3>
                <p className="text-gray-600 text-sm">
                  Browse properties, save favorites, and connect with landlords
                  to find your perfect home.
                </p>
              </div>
            </div>
          </div>

          {/* Operator Role */}
          <div
            onClick={() => !loading && handleRoleSelection("operator")}
            className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
              loading && selectedRole === "operator"
                ? "border-blue-500 bg-blue-50 cursor-wait"
                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
            } ${loading ? "pointer-events-none opacity-75" : ""}`}
          >
            {loading && selectedRole === "operator" && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-xl">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  I'm a Property Owner/Manager
                </h3>
                <p className="text-gray-600 text-sm">
                  List properties, manage tenants, and grow your rental business
                  with our platform.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-4">
            You can change your role later in account settings
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
            disabled={loading}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense fallback={<GlobalLoader isLoading={true} message="Loading..." />}>
      <SelectRoleContent />
    </Suspense>
  );
}
