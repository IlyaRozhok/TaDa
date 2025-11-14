"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  setAuth,
} from "../../../store/slices/authSlice";
import { authAPI } from "../../../lib/api";
import { redirectAfterLogin } from "../../../utils/simpleRedirect";
import Link from "next/link";
import { ArrowLeft, User, Building, Loader2, CheckCircle } from "lucide-react";
import Logo from "../../../components/Logo";
import { Button } from "../../../components/ui/Button";

type UserType = "tenant" | "operator";

function SelectRoleContent() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleData, setGoogleData] = useState<any>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for tempToken in URL
    const token = searchParams.get("tempToken");
    if (token) {
      setTempToken(token);
      // Fetch Google user data from tempToken
      fetchGoogleUserData(token);
    } else if (!isAuthenticated || !user) {
      // Only redirect if no tempToken and not authenticated
      router.push("/app/auth/register");
    }
  }, [isAuthenticated, user, router, searchParams]);

  const fetchGoogleUserData = async (token: string) => {
    try {
      const response = await authAPI.getTempTokenInfo(token);
      setGoogleData(response.data.googleData);
    } catch (error) {
      console.error("Failed to fetch Google user data:", error);
      setError("Invalid or expired token. Please try again.");
    }
  };

  const handleRoleSelection = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    setError("");

    try {
      let response;

      if (tempToken) {
        // Create new user from tempToken
        response = await authAPI.createGoogleUserFromTempToken(tempToken, {
          role: selectedRole,
        });
      } else if (user) {
        // Update existing user role
        response = await authAPI.updateUserRole(user.id, {
          role: selectedRole,
        });
      } else {
        throw new Error("No user or tempToken available");
      }

      // Update user data in Redux store
      dispatch(
        setAuth({
          user: response.user,
          accessToken: response.access_token || localStorage.getItem("accessToken"),
        })
      );

      // Redirect to appropriate dashboard based on role
      setTimeout(() => {
        redirectAfterLogin(response.user, router);
      }, 100);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || "Failed to set role. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // User can skip role selection for now and go to dashboard with default role
    if (user) {
      redirectAfterLogin(user, router);
    } else {
      router.push("/app/dashboard");
    }
  };

  if (!isAuthenticated && !user && !tempToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4 relative">
      {/* Logo in top left */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo size="sm" />
        </Link>
      </div>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-16"></div> {/* Spacer for centering */}
            <h1 className="text-2xl font-bold text-gray-900">
              Choose Your Role
            </h1>
            <Link
              href="/app/auth/register"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Tell us how you plan to use TaDa</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to TaDa, {googleData?.email || user?.email}!
            </h2>
            <p className="text-gray-600">
              {tempToken
                ? "Your Google account has been verified. Now let's personalize your experience."
                : "Your account has been created successfully. Now let's personalize your experience."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              I am a...
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole("tenant")}
                className={`flex flex-col items-center p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-100 ${
                  selectedRole === "tenant"
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                    : "border-gray-300 hover:bg-gray-50 text-gray-700 hover:border-gray-400"
                }`}
              >
                <User className="w-10 h-10 mb-3" />
                <span className="font-semibold text-lg mb-1">Tenant</span>
                <span
                  className={`text-sm text-center leading-relaxed ${
                    selectedRole === "tenant"
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  I&apos;m looking for properties to rent
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("operator")}
                className={`flex flex-col items-center p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-100 ${
                  selectedRole === "operator"
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                    : "border-gray-300 hover:bg-gray-50 text-gray-700 hover:border-gray-400"
                }`}
              >
                <Building className="w-10 h-10 mb-3" />
                <span className="font-semibold text-lg mb-1">Operator</span>
                <span
                  className={`text-sm text-center leading-relaxed ${
                    selectedRole === "operator"
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  I&apos;m managing properties for rent
                </span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRoleSelection}
              disabled={!selectedRole || isLoading}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up your account...
                </div>
              ) : (
                "Continue"
              )}
            </Button>

            <Button
              onClick={handleSkip}
              variant="outline"
              className="sm:w-auto border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-medium text-gray-600"
            >
              Skip for now
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Don&apos;t worry, you can always change this later in your profile
            settings.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SelectRoleContent />
    </Suspense>
  );
}
