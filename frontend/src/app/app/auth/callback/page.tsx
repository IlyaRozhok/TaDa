"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/slices/authSlice";
import { AppDispatch } from "@/store/store";
import {
  setAnalyticsUser,
  setAttributionUserProperties,
  track,
} from "@/lib/analytics/ga";
import { authAPI } from "../../../lib/api";
import { redirectAfterLogin } from "../../../utils/simpleRedirect";

function AuthCallbackContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const success = searchParams?.get("success");
        const needsRoleSelection = searchParams?.get("needsRoleSelection");
        const registrationId = searchParams?.get("registrationId");

        console.log("🔍 Callback parameters:", {
          success,
          needsRoleSelection,
          hasRegistrationId: !!registrationId,
          currentURL: window.location.href,
          apiUrl: process.env.NEXT_PUBLIC_API_URL,
        });

        // Handle OAuth errors
        const oauthError = searchParams?.get("error");
        const errorDetails = searchParams?.get("details");
        
        if (oauthError) {
          console.error("❌ OAuth error detected:", { oauthError, errorDetails });
          // User-facing copy, so plain English: this screen greets anyone who
          // taps "Cancel" on Google's consent page.
          let errorMessage = "We couldn't sign you in with Google.";

          if (oauthError === "oauth_error" && errorDetails === "access_denied") {
            errorMessage =
              "The sign-in was cancelled. You can try again whenever you're ready.";
          } else if (oauthError === "no_user_data") {
            errorMessage =
              "Google didn't return your account details. Please try again.";
          } else if (oauthError === "auth_failed") {
            errorMessage = "Sign-in didn't complete. Please try again.";
          }

          setError(errorMessage);
          setLoading(false);
          return;
        }

        // Handle new user that needs role selection
        if (needsRoleSelection && registrationId) {
          console.log("🔄 New user needs role selection");

          // Store registration ID in sessionStorage for role selection
          sessionStorage.setItem("googleRegistrationId", registrationId);

          // There is no role-selection screen: nothing reads needsRole, so the
          // parameter only ever decorated a plain visit to the home page.
          console.log("✅ Redirecting to the home page");
          router.replace("/");
          return;
        }

        // If backend still passes success flag, keep previous safety check.
        // In cookie-based flow `success` may be omitted, so we only validate when it's present.
        if (success && success !== "true") {
          console.error("❌ Invalid callback parameters:", {
            success,
            allParams: searchParams
              ? Object.fromEntries(searchParams.entries())
              : {},
          });
          setError("Something went wrong during sign-in. Please try again.");
          setLoading(false);
          return;
        }

        console.log("🔍 Getting user profile via /api/auth/me...");
        const profileResponse = await authAPI.getMe();

        console.log("🔍 Profile response:", {
          hasResponse: !!profileResponse,
          hasUser: !!profileResponse?.data?.user,
          userEmail: profileResponse?.data?.user?.email,
          userRole: profileResponse?.data?.user?.role,
          userProvider: profileResponse?.data?.user?.provider,
        });

        // Validate profile response
        if (
          !profileResponse ||
          !profileResponse.data ||
          !profileResponse.data.user
        ) {
          console.error("❌ Failed to get user profile");
          setError("Failed to get user profile. Please try logging in again.");

          return;
        }

        // Update Redux store
        console.log("🔍 Updating Redux store with user data");
        dispatch(setUser({ user: profileResponse.data.user }));

        // Simple redirect based on user
        const user = profileResponse.data.user;

        // Analytics identity first, so the sign-in event below is attributed
        // and gated by role. The internal UUID is sent — never email or phone.
        setAnalyticsUser({ id: user.id, role: user.role });

        // The ad click that brought this visitor in, captured on the landing
        // page before Google took the browser away and stored since. Set before
        // the event below, not after: a user property does not attach to an
        // event that has already been sent, and `sign_up` is the conversion
        // this has to be attributable to.
        setAttributionUserProperties();

        // `is_new` is set by the backend only when this request created the
        // account, which is the one moment a registration is distinguishable
        // from a repeat sign-in. This runs on the OAuth callback alone: session
        // restore on later page loads must not count as a login.
        const isNewUser = searchParams?.get("is_new") === "1";

        if (isNewUser) {
          track({ name: "sign_up", params: { method: "google" } });
        } else {
          track({ name: "login", params: { method: "google" } });
        }
        console.log("🔄 OAuth callback: Redirecting user", {
          email: user.email,
          role: user.role,
          provider: user.provider,
        });

        // Add small delay to ensure Redux state is updated
        setTimeout(async () => {
          await redirectAfterLogin(user, router);
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

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router, dispatch]);

  if (loading) {
    return null; // No loader, just redirect
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
          {/* No debug affordances here: this page greets real visitors on the
              only sign-in funnel. Configuration problems are diagnosed from
              the server logs, not from a button shown to users. */}
          <div className="space-y-3">
            <button
              onClick={() => router.push("/app/auth")}
              className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full text-gray-500 px-6 py-2 text-sm hover:text-gray-900 transition-colors"
            >
              Back to home
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
    <Suspense fallback={null}>
      <AuthCallbackContent />
    </Suspense>
  );
}
