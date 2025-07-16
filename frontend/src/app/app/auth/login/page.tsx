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
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import WelcomeModal from "../../../components/WelcomeModal";
import {
  getUserRole,
  getDashboardPath,
} from "../../../components/DashboardRouter";
import Logo from "../../../components/Logo";
import LiquidForm from "../../../components/ui/LiquidForm";
import GlassButton from "../../../components/ui/GlassButton";

export default function LoginPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      // Проверяем, что у нас есть все необходимые данные
      if (!response || !response.user || !response.access_token) {
        throw new Error("Invalid response from server");
      }

      console.log("🔍 Login successful, user data:", {
        user_id: response.user.id,
        user_email: response.user.email,
        user_role: response.user.role,
        user_roles: response.user.roles,
        user_full_name: response.user.full_name,
        has_tenant_profile: !!response.user.tenantProfile,
        has_operator_profile: !!response.user.operatorProfile,
      });

      dispatch(
        setCredentials({
          user: response.user,
          accessToken: response.access_token,
        })
      );

      // Show welcome modal for new users
      const welcomeShownKey = `welcome_shown_${response.user.id}`;
      const hasShownWelcome = localStorage.getItem(welcomeShownKey);

      if (!hasShownWelcome) {
        setShowWelcome(true);
        // Don't redirect immediately, let the modal handle it
        return;
      }

      const userRole = getUserRole(response.user);
      const dashboardPath = getDashboardPath(userRole);

      console.log("🔄 Login redirect:", {
        userRole,
        dashboardPath,
        user_data: response.user,
      });

      router.push(dashboardPath);
    } catch (error: unknown) {
      console.error("Login error:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: { message?: string; error?: string };
          };
        };

        if (axiosError.response?.status === 401) {
          setError("Invalid email or password");
        } else if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message);
        } else if (axiosError.response?.data?.error) {
          setError(axiosError.response.data.error);
        } else {
          setError("An error occurred. Please try again later.");
        }
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    // Mark welcome as shown
    if (user) {
      const welcomeShownKey = `welcome_shown_${user.id}`;
      localStorage.setItem(welcomeShownKey, "true");
    }
    // Redirect to appropriate dashboard
    if (user) {
      const userRole = getUserRole(user);
      const dashboardPath = getDashboardPath(userRole);

      console.log("🔄 Welcome close redirect:", {
        userRole,
        dashboardPath,
        user_data: user,
      });

      router.push(dashboardPath);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-r from-[#141E30] via-[#2C3E50] to-[#243B55]">
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
              href="/app/auth/register"
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              Don&apos;t have an account?{" "}
              <span className="text-slate-900">Register</span>
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
          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center text-white/90 hover:text-white transition-colors mb-8 font-medium group px-4 py-2 rounded-lg hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Home
          </Link>

          <LiquidForm
            title="Welcome Back"
            description="Sign in to your account"
            variant="floating"
          >
            {/* Logo section removed since title is now in LiquidForm */}

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200">
                {error}
              </div>
            )}

            {/* Google OAuth Button */}
            <div className="mb-6">
              <GlassButton
                onClick={handleGoogleAuth}
                variant="secondary"
                size="lg"
                className="w-full"
                icon={
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
                }
              >
                Continue with Google
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

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    required
                    className="w-full text-slate-800 bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-slate-400/60 focus:border-slate-600/70 focus:ring focus:ring-slate-500/40 focus:ring-opacity-50 transition-colors duration-200 placeholder:text-slate-500"
                    placeholder="Enter your email"
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
                      required
                      className="w-full text-slate-800 bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-slate-400/60 focus:border-slate-600/70 focus:ring focus:ring-slate-500/40 focus:ring-opacity-50 transition-colors duration-200 placeholder:text-slate-500"
                      placeholder="Enter your password"
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

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                    />
                    <span className="ml-2 text-sm text-slate-700 hover:text-slate-900">
                      Remember me
                    </span>
                  </label>
                  <Link
                    href="/app/auth/forgot-password"
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 hover:scale-105 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </LiquidForm>
        </div>
      </div>

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleCloseWelcome}
        userName={user?.full_name}
      />
    </div>
  );
}
