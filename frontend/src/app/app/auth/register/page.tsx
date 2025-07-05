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
import {
  Home,
  ArrowLeft,
  User,
  Building,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

type UserType = "tenant" | "operator";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  userType: UserType;
}

export default function RegisterPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    userType: "tenant",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();

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

    // Prevent multiple submissions
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
        full_name: formData.full_name,
        is_operator: formData.userType === "operator",
      };

      const { user, access_token } = await authAPI.register(registerData);

      dispatch(
        setCredentials({
          user,
          accessToken: access_token,
        })
      );

      // Redirect to dashboard based on role
      if (formData.userType === "operator") {
        router.push("/app/dashboard/operator");
      } else {
        router.push("/app/dashboard/tenant");
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);
      let errorMessage = "An error occurred during registration";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: { message?: string };
          };
        };

        if (axiosError.response?.status === 409) {
          errorMessage = "An account with this email already exists";
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
              href="/app/auth/login"
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className="w-full max-w-lg">
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
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">
                  Create Account
                </h1>
                <p className="text-slate-600">
                  Join the TaDa property platform
                </p>
              </div>
            </div>

            {/* Account Type Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Choose Account Type
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${
                    formData.userType === "tenant"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="userType"
                    value="tenant"
                    checked={formData.userType === "tenant"}
                    onChange={(e) =>
                      handleUserTypeChange(e.target.value as UserType)
                    }
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Home className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Tenant</div>
                      <div className="text-sm text-slate-600">
                        Looking for property
                      </div>
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${
                    formData.userType === "operator"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="userType"
                    value="operator"
                    checked={formData.userType === "operator"}
                    onChange={(e) =>
                      handleUserTypeChange(e.target.value as UserType)
                    }
                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <div className="ml-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        Operator
                      </div>
                      <div className="text-sm text-slate-600">
                        Managing properties
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border text-slate-900 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

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
                  className="w-full px-4 py-3 border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-12 border text-slate-900 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Create a password (min 6 chars)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
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
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-12 border text-slate-900 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
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

              <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                <p className="mb-2">
                  <strong>Next steps after registration:</strong>
                </p>
                <ul className="space-y-1 text-sm">
                  {formData.userType === "tenant" ? (
                    <>
                      <li>• Complete your profile with personal details</li>
                      <li>• Set your property preferences</li>
                      <li>• Start browsing and saving properties</li>
                    </>
                  ) : (
                    <>
                      <li>• Set up your property operator profile</li>
                      <li>• Add your first property listing</li>
                      <li>• Manage tenant applications</li>
                    </>
                  )}
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="text-center pt-4">
                <p className="text-slate-600">
                  Already have an account?{" "}
                  <Link
                    href="/app/auth/login"
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Sign in here
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
