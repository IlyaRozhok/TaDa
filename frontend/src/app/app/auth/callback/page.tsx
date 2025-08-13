"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAuth } from "../../../store/slices/authSlice";
import { fetchShortlist } from "../../../store/slices/shortlistSlice";
import { AppDispatch } from "../../../store/store";
import { authAPI, usersAPI } from "../../../lib/api";
import GlobalLoader from "../../../components/GlobalLoader";
import { redirectAfterLogin } from "../../../utils/simpleRedirect";

function AuthCallbackContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      console.log("🔍 OAuth callback started");

      try {
        const token = searchParams.get("token");
        const success = searchParams.get("success");
        const needsRoleSelection = searchParams.get("needsRoleSelection");
        const registrationId = searchParams.get("registrationId");

        console.log("🔍 Callback parameters:", {
          hasToken: !!token,
          success,
          needsRoleSelection,
          hasRegistrationId: !!registrationId,
          currentURL: window.location.href,
          apiUrl: process.env.NEXT_PUBLIC_API_URL,
        });

        // Handle new user that needs role selection
        if (needsRoleSelection && registrationId) {
          console.log("🔄 New user needs role selection");

          // Store registration ID in sessionStorage for role selection
          sessionStorage.setItem("googleRegistrationId", registrationId);

          // Redirect to home page for role selection
          console.log("✅ Redirecting to role selection");
          router.replace("/?needsRole=true&isGoogleAuth=true");
          return;
        }

        if (!token || success !== "true") {
          console.error("❌ Invalid callback parameters:", {
            token: !!token,
            success,
          });
          setError("Invalid callback parameters");
          setLoading(false);
          return;
        }

        console.log("🔍 Token received, storing and validating...", {
          tokenStart: token.substring(0, 20) + "...",
          tokenLength: token.length,
        });

        // Store the token
        localStorage.setItem("accessToken", token);
        localStorage.setItem(
          "sessionExpiry",
          String(Date.now() + 24 * 60 * 60 * 1000)
        ); // 24 hours

        // Verify token was stored
        const storedToken = localStorage.getItem("accessToken");
        console.log("🔍 Token stored in localStorage:", !!storedToken);

        console.log("🔍 Getting user profile...");
        // Get user profile with explicit token in request
        const profileResponse = await usersAPI.getMe();

        console.log("🔍 Profile response:", {
          hasResponse: !!profileResponse,
          hasUser: !!profileResponse?.data?.user,
          userEmail: profileResponse?.data?.user?.email,
          userRole: profileResponse?.data?.user?.role,
          userProvider: profileResponse?.data?.user?.provider,
          fullUser: profileResponse?.data?.user,
        });

        // Validate profile response
        if (
          !profileResponse ||
          !profileResponse.data ||
          !profileResponse.data.user
        ) {
          console.error("❌ Failed to get user profile");
          setError("Failed to get user profile. Please try logging in again.");

          // Clear invalid token
          localStorage.removeItem("accessToken");
          localStorage.removeItem("sessionExpiry");

          return;
        }

        // Update Redux store
        console.log("🔍 Updating Redux store with user data");
        dispatch(
          setAuth({
            user: profileResponse.data.user,
            accessToken: token,
          })
        );

        // Initialize shortlist for tenant users
        if (profileResponse.data.user?.role === "tenant") {
          console.log(
            "🛒 Initializing shortlist for tenant user via OAuth callback"
          );
          dispatch(fetchShortlist());
        }

        // Simple redirect based on user
        const user = profileResponse.data.user;
        console.log("🔄 OAuth callback: Redirecting user", {
          email: user.email,
          role: user.role,
          provider: user.provider,
        });

        // Add small delay to ensure Redux state is updated
        setTimeout(() => {
          redirectAfterLogin(user, router);
        }, 100);
      } catch (error: any) {
        console.error("❌ OAuth callback error:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          stack: error.stack,
        });

        let errorMessage = "Authentication failed";

        if (error.response?.status === 401) {
          errorMessage = "Invalid or expired token. Please try again.";
        } else if (error.response?.status === 403) {
          errorMessage = "Access denied. Please check your permissions.";
        } else if (error.response?.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Clear any stored tokens on error
        localStorage.removeItem("accessToken");
        localStorage.removeItem("sessionExpiry");

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto px-4">
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
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/")}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                console.log("🔍 Current state for debugging:", {
                  localStorage: {
                    accessToken: !!localStorage.getItem("accessToken"),
                    sessionExpiry: localStorage.getItem("sessionExpiry"),
                  },
                  searchParams: Object.fromEntries(searchParams.entries()),
                  currentURL: window.location.href,
                });
              }}
              className="w-full text-gray-500 px-6 py-2 text-sm hover:text-gray-700 transition-colors"
            >
              Show Debug Info (Check Console)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<GlobalLoader isLoading={true} message="Loading..." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
