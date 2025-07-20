"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  setCredentials,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";
import { authAPI } from "../../lib/api";
import Link from "next/link";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building,
  CheckCircle,
} from "lucide-react";
import Logo from "../../components/Logo";
import { Button } from "../../components/ui/Button";

type UserType = "tenant" | "operator";

export default function UnifiedAuthPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"credentials" | "role">("credentials");
  const [requiresRegistration, setRequiresRegistration] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/app/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // First attempt - no role specified
      const response = await authAPI.authenticate({
        email,
        password,
        role: selectedRole || undefined,
        rememberMe,
      });

      if (response.requiresRegistration) {
        // User doesn't exist, need to select role
        setRequiresRegistration(true);
        setStep("role");
        setIsLoading(false);
        return;
      }

      // Success - either login or registration completed
      dispatch(
        setCredentials({
          user: response.user,
          accessToken: response.access_token,
        })
      );

      router.push("/app/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message ||
          "Authentication failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: UserType) => {
    setSelectedRole(role);
  };

  const handleRoleSubmit = () => {
    if (!selectedRole) {
      setError("Please select your account type");
      return;
    }
    handleSubmit();
  };

  const handleGoogleAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password
    router.push("/app/auth/forgot-password");
  };

  if (step === "role" && requiresRegistration) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 relative">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute inset-0 bg-black/50 z-0"></div>
          <img
            src="/auth-bg.jpg"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <Logo size="md" className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">
                Choose Your Account Type
              </h2>
              <p className="text-gray-600 mt-2">
                Select how you want to use TaDa
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              {/* Tenant Option */}
              <div
                onClick={() => handleRoleSelect("tenant")}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedRole === "tenant"
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-full ${
                      selectedRole === "tenant"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${
                        selectedRole === "tenant"
                          ? "text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      I'm looking for a place
                    </h3>
                    <p className="text-sm text-gray-600">
                      Find and save properties
                    </p>
                  </div>
                  {selectedRole === "tenant" && (
                    <CheckCircle className="w-5 h-5 text-gray-900" />
                  )}
                </div>
              </div>

              {/* Operator Option */}
              <div
                onClick={() => handleRoleSelect("operator")}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedRole === "operator"
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-full ${
                      selectedRole === "operator"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${
                        selectedRole === "operator"
                          ? "text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      I have properties to rent
                    </h3>
                    <p className="text-sm text-gray-600">
                      List and manage properties
                    </p>
                  </div>
                  {selectedRole === "operator" && (
                    <CheckCircle className="w-5 h-5 text-gray-900" />
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleRoleSubmit}
              disabled={!selectedRole || isLoading}
              className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </div>
              ) : (
                "Continue"
              )}
            </Button>

            <button
              onClick={() => {
                setStep("credentials");
                setRequiresRegistration(false);
                setError("");
              }}
              className="mt-4 text-sm text-gray-600 hover:text-gray-900 w-full text-center"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <img
          src="/auth-bg.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <Logo size="md" className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">
              Sign in to Tada
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-slate-900 w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors"
                  placeholder="email@gmail.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-slate-900 w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">Or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Social Login */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleGoogleAuth}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
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
            </button>

            <button
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            <button
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="black">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </button>
          </div>

          {/* Terms & Privacy */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By clicking Continue with Google, Facebook, or Apple, you agree to
              Tada{" "}
              <Link href="/terms" className="underline">
                Term's of Use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Tada may send you communications; you may change your preferences
              in your account settings. We'll never post without your permission
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
