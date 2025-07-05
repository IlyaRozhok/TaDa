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
import { useTranslations } from "../../../lib/language-context";
import Link from "next/link";
import { Home, ArrowLeft, Loader2 } from "lucide-react";

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

  const router = useRouter();
  const dispatch = useDispatch();
  const t = useTranslations();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated && user) {
      if (user.is_operator) {
        router.push("/app/dashboard/operator");
      } else {
        router.push("/app/dashboard/tenant");
      }
    }
  }, [isAuthenticated, user, router]);

  // If user is already authenticated, show loading
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
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

    // Prevent multiple submissions
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const { user, access_token } = await authAPI.login({
        email: formData.email,
        password: formData.password,
        role: "tenant", // Default role for login
      });

      // Store credentials in Redux and localStorage
      dispatch(
        setCredentials({
          user,
          accessToken: access_token,
        })
      );

      // Redirect to dashboard based on role
      if (user.is_operator) {
        router.push("/app/dashboard/operator");
      } else {
        router.push("/app/dashboard/tenant");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      let errorMessage = "An error occurred during login";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: { message?: string };
          };
        };

        // Special handling for 401 error
        if (axiosError.response?.status === 401) {
          errorMessage = "Invalid email or password";
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">TaDa</h1>
                <p className="text-xs text-slate-500 -mt-1">
                  Property Platform
                </p>
              </div>
            </Link>

            <Link
              href="/app/auth/register"
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              Don't have an account? Register
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
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-8 font-medium group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Home
          </Link>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">
                  Welcome Back
                </h1>
                <p className="text-slate-600">Sign in to your account</p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="placeholder:text-gray-500 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="placeholder:text-gray-500 w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <Link
                  href="/app/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="text-center pt-4">
                <p className="text-slate-600">
                  Don't have an account?{" "}
                  <Link
                    href="/app/auth/register"
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Create one here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
