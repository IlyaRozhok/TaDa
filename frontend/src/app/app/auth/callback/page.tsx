"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../../store/slices/authSlice";
import { authAPI } from "../../../lib/api";
import GlobalLoader from "../../../components/GlobalLoader";

// Separate component that uses useSearchParams
function AuthCallbackContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get("token");
        const success = searchParams.get("success");
        const errorParam = searchParams.get("error");

        // console.log("🔍 OAuth callback parameters:", { hasToken: !!token, tokenLength: token?.length, success, errorParam });

        if (errorParam) {
          const decodedError = decodeURIComponent(errorParam);
          setError(decodedError);
          setLoading(false);
          return;
        }

        if (!token || success !== "true") {
          setError("Invalid callback parameters");
          setLoading(false);
          return;
        }

        // console.log("🔍 Token received, storing and validating...", { tokenStart: token.substring(0, 20) + "...", tokenLength: token.length });

        // Store the token
        localStorage.setItem("accessToken", token);
        localStorage.setItem(
          "sessionExpiry",
          String(Date.now() + 24 * 60 * 60 * 1000)
        ); // 24 hours

        // Verify token was stored
        const storedToken = localStorage.getItem("accessToken");

        // Get user profile with explicit token in request
        const profileResponse = await authAPI.getProfile();

        // Validate profile response
        if (!profileResponse || !profileResponse.user) {
          setError("Failed to get user profile");
          return;
        }

        // Update Redux store
        dispatch(
          setCredentials({
            user: profileResponse.user,
            accessToken: token,
          })
        );

        // Redirect to dashboard
        router.replace("/app/dashboard");
      } catch (error: any) {
        console.error("OAuth callback error:", error.message || error);

        let errorMessage = "Authentication failed";

        if (error.response?.status === 401) {
          errorMessage = "Invalid or expired token. Please try again.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router, dispatch]);

  if (loading) {
    return (
      <GlobalLoader isLoading={true} message="Completing authentication..." />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Authentication Failed
            </h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/app/auth/login")}
                className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex-1 bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Main page component with Suspense boundary
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<GlobalLoader isLoading={true} message="Loading authentication..." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
