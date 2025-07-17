"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  setCredentials,
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import { authAPI } from "../../../lib/api";
import Link from "next/link";
import { ArrowLeft, User, Building, Loader2, Eye, EyeOff } from "lucide-react";
import {
  getUserRole,
  getDashboardPath,
} from "../../../components/DashboardRouter";
import Logo from "../../../components/Logo";
import LiquidForm from "../../../components/ui/LiquidForm";
import GlassButton from "../../../components/ui/GlassButton";

type UserType = "tenant" | "operator";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
}

export default function RegisterPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    userType: "tenant",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated && user) {
      const userRole = getUserRole(user);
      const dashboardPath = getDashboardPath(userRole);
      router.push(dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  // If user is already authenticated, show loading
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-black">
        <div className="text-center bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-800 font-medium">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserTypeChange = (type: UserType) => {
    setFormData((prev) => ({
      ...prev,
      userType: type,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const registerData = {
        email: formData.email,
        password: formData.password,
        role: formData.userType,
      };

      const response = await authAPI.register(registerData);

      // Проверяем, что у нас есть все необходимые данные
      if (!response || !response.user || !response.access_token) {
        throw new Error("Invalid response from server");
      }

      dispatch(
        setCredentials({
          user: response.user,
          accessToken: response.access_token,
        })
      );

      // Redirect to dashboard based on role
      const userRole = getUserRole(response.user);
      const dashboardPath = getDashboardPath(userRole);
      router.push(dashboardPath);
    } catch (error: unknown) {
      console.error("Registration error:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: { message?: string; error?: string };
          };
        };

        // Показываем сообщение об ошибке от сервера или дружественное сообщение
        if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message);
        } else if (axiosError.response?.data?.error) {
          setError(axiosError.response.data.error);
        } else if (axiosError.response?.status === 409) {
          setError("An account with this email already exists");
        } else if (axiosError.response?.status === 400) {
          setError("Please check your input and try again");
        } else {
          setError(
            "An error occurred during registration. Please try again later."
          );
        }
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "An error occurred during registration. Please try again later."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-white">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
            >
              <Logo size="sm" />
              <div>
                <h1 className="text-lg font-semibold text-slate-900">TaDa</h1>
                <p className="text-xs text-slate-500 -mt-1">
                  Property Platform
                </p>
              </div>
            </Link>

            <Link
              href="/app/auth/login"
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              Already have an account?{" "}
              <span className="text-slate-900">Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen flex items-start justify-center px-4 py-16 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-300" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg relative z-10">
          <Link
            href="/"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-8 font-medium group px-4 py-2 rounded-lg hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Home
          </Link>

          <LiquidForm
            title="Create Account"
            description="Join our property platform today"
            variant="floating"
          >
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200">
                {error}
              </div>
            )}

            {/* Google OAuth Button */}
            <div className="mb-6">
              <GlassButton
                onClick={() => {
                  if (isGoogleLoading) return; // Prevent multiple clicks

                  setIsGoogleLoading(true);
                  const backendUrl =
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
                  window.location.href = `${backendUrl}/auth/google`;
                }}
                variant="secondary"
                size="lg"
                className="w-full"
                disabled={isGoogleLoading || isLoading}
                icon={
                  isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )
                }
              >
                {isGoogleLoading
                  ? "Redirecting to Google..."
                  : "Continue with Google"}
              </GlassButton>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-400/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 py-1 rounded-lg text-slate-600 bg-white/50 backdrop-blur-sm">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* User Type Selection */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/40 backdrop-blur-sm rounded-lg border border-slate-400/60">
                <button
                  type="button"
                  onClick={() => handleUserTypeChange("tenant")}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    formData.userType === "tenant"
                      ? "bg-white/60 backdrop-blur-sm text-slate-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium">Tenant</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUserTypeChange("operator")}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    formData.userType === "operator"
                      ? "bg-white/60 backdrop-blur-sm text-slate-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span className="font-medium">Operator</span>
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full text-slate-800 bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-slate-400/60 focus:border-slate-600/70 focus:ring focus:ring-slate-500/40 focus:ring-opacity-50 transition-colors duration-200 placeholder:text-slate-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full text-slate-800 bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-slate-400/60 focus:border-slate-600/70 focus:ring focus:ring-slate-500/40 focus:ring-opacity-50 transition-colors duration-200 placeholder:text-slate-500"
                      placeholder="Create a password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full text-slate-800 bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-slate-400/60 focus:border-slate-600/70 focus:ring focus:ring-slate-500/40 focus:ring-opacity-50 transition-colors duration-200 placeholder:text-slate-500"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-2.5 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 hover:scale-105 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>
          </LiquidForm>
        </div>
      </div>

      {/* Google OAuth Loading Overlay */}
      {isGoogleLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Redirecting to Google
              </h3>
              <p className="text-gray-600 mb-4">
                Please wait while we redirect you to Google for
                authentication...
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>This may take a few seconds</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
