"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/slices/authSlice";
import { fetchShortlist } from "@/store/slices/shortlistSlice";
import { AppDispatch } from "@/store/store";
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
        const oauthError = searchParams?.get("error");
        const errorDetails = searchParams?.get("details");

        if (oauthError) {
          let errorMessage = "Authentication failed. Please try again.";

          if (oauthError === "oauth_error") {
            if (errorDetails === "invalid_client") {
              errorMessage = "OAuth client not found. Please check Google Cloud Console settings.";
            } else if (errorDetails === "access_denied") {
              errorMessage = "Access denied. You cancelled the authorisation.";
            } else {
              errorMessage = `OAuth error: ${errorDetails || oauthError}`;
            }
          } else if (oauthError === "no_user_data") {
            errorMessage = "Could not retrieve your Google account data.";
          } else if (oauthError === "auth_failed") {
            errorMessage = "Authentication failed. Please try again.";
          }

          setError(errorMessage);
          setLoading(false);
          return;
        }

        const profileResponse = await authAPI.getMe();

        if (!profileResponse?.data?.user) {
          setError("Failed to get user profile. Please try logging in again.");
          setLoading(false);
          return;
        }

        const user = profileResponse.data.user;
        dispatch(setUser({ user }));

        if (user.role === "tenant" || user.role === "admin") {
          dispatch(fetchShortlist());
        }

        setTimeout(async () => {
          await redirectAfterLogin(user, router);
        }, 100);
      } catch (err: any) {
        let errorMessage = "Authentication failed";

        if (err.response?.status === 401) {
          errorMessage = "Session expired. Please try again.";
        } else if (err.response?.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router, dispatch]);

  if (loading) return null;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => router.push("/app/auth")}
            className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
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
