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
import { Home, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import WelcomeModal from "../../../components/WelcomeModal";

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
      if (user.roles?.includes("operator")) {
        router.push("/app/dashboard/operator");
      } else {
        router.push("/app/dashboard/tenant");
      }
    }
  }, [isAuthenticated, user, router]);

  // If user is already authenticated, show loading
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100/50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to dashboard...</p>
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
        role: "tenant",
      });

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

      // Show welcome modal for new users
      const welcomeShownKey = `welcome_shown_${response.user.id}`;
      const hasShownWelcome = localStorage.getItem(welcomeShownKey);
      
      if (!hasShownWelcome) {
        setShowWelcome(true);
        // Don't redirect immediately, let the modal handle it
        return;
      }

      if (response.user.roles?.includes("operator")) {
        router.push("/app/dashboard/operator");
      } else {
        router.push("/app/dashboard/tenant");
      }
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

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    // Mark welcome as shown
    if (user) {
      const welcomeShownKey = `welcome_shown_${user.id}`;
      localStorage.setItem(welcomeShownKey, 'true');
    }
    // Redirect to appropriate dashboard
    if (user?.roles?.includes("operator")) {
      router.push("/app/dashboard/operator");
    } else {
      router.push("/app/dashboard/tenant");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-slate-900/20 transition-all duration-300">
                <Home className="w-4 h-4 text-white" />
              </div>
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
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className="w-full max-w-md">
          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-8 font-medium group px-4 py-2 rounded-lg hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Home
          </Link>

          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-pink-500/5 rounded-3xl" />
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-3xl" />

            <div className="relative bg-white/70 rounded-3xl p-8 shadow-xl shadow-slate-900/5 border border-white/20">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Welcome Back
                  </h2>
                  <p className="text-slate-500">Sign in to your account</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600">
                  {error}
                </div>
              )}

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
                      className="w-full text-slate-900 px-4 py-2.5 rounded-lg border border-slate-200 focus:border-slate-300 focus:ring focus:ring-slate-200 focus:ring-opacity-50 transition-colors duration-200"
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
                        className="w-full text-slate-900 px-4 py-2.5 rounded-lg border border-slate-200 focus:border-slate-300 focus:ring focus:ring-slate-200 focus:ring-opacity-50 transition-colors duration-200"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                      <span className="ml-2 text-sm text-slate-600">
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
                  className="w-full px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70"
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
            </div>
          </div>
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
