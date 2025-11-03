"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAuth } from "../../store/slices/authSlice";
import { fetchShortlist } from "../../store/slices/shortlistSlice";
import { AppDispatch } from "../../store/store";
import { authAPI } from "../../lib/api";
import { redirectAfterLogin } from "../../utils/simpleRedirect";
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
import { Button } from "../../components/ui/Button";
import OnboardingFlow from "../../components/OnboardingFlow";
import Logo from "../../components/Logo";

export default function UnifiedAuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Check for Google auth parameters and existing users without roles
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tempToken = urlParams.get("tempToken");
    const error = urlParams.get("error");
    const needsRole = urlParams.get("needsRole");
    const isGoogleAuthParam = urlParams.get("isGoogleAuth");

    if (error) {
      setError("Google authentication failed. Please try again.");
      return;
    }

    if (tempToken) {
      // Handle Google auth callback with temp token
      authAPI
        .getTempTokenInfo(tempToken)
        .then((response) => {
          const googleUserData = response.data;
          setNewUser(googleUserData);
          setShowOnboarding(true);
        })
        .catch((err) => {
          console.error("Failed to get temp token info:", err);
          setError("Failed to retrieve Google user data");
        });
    } else if (needsRole === "true" && isGoogleAuthParam === "true") {
      // Handle Google auth that needs role selection
      setIsGoogleAuth(true);
      setShowOnboarding(true);

      // Get Google registration data from sessionStorage
      const googleRegistrationId = sessionStorage.getItem(
        "googleRegistrationId"
      );
      if (googleRegistrationId) {
        // Create a temporary user object for Google auth
        setNewUser({
          id: googleRegistrationId,
          email: "Google User", // Will be filled from API
          role: null,
          provider: "google",
        });
      }
    }

    // Check if user is already authenticated but doesn't have a role
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Check if user has a role set
      authAPI
        .getMe()
        .then((response) => {
          const user = response.data;
          if (user && !user.role) {
            // User exists but doesn't have a role - show onboarding
            setNewUser(user);
            setShowOnboarding(true);
          }
        })
        .catch((error) => {
          // Token might be invalid, clear it
          localStorage.removeItem("accessToken");
        });
    }
  }, []);

  // Removed automatic redirect for authenticated users to prevent redirect loops
  // Users should explicitly navigate to where they want to go

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Step 1: Check if user exists
      const checkResponse = await authAPI.checkUser(email);

      if (checkResponse.data.exists) {
        // User exists - attempt login
        const loginResponse = await authAPI.login({ email, password });


        dispatch(
          setAuth({
            user: loginResponse.data.user,
            accessToken: loginResponse.data.access_token,
          })
        );

        // Initialize shortlist for tenant users
        if (loginResponse.data.user?.role === "tenant") {
          
          dispatch(fetchShortlist());
        }

        // Verify token was stored
        const storedToken = localStorage.getItem("accessToken");
        

        // Redirect based on user role
        setTimeout(() => {
          redirectAfterLogin(loginResponse.data.user, router);
        }, 100);
      } else {
        // User doesn't exist - show onboarding for new registration
        setNewUser({
          email: email,
          password: password,
          role: null,
          provider: "local",
        });
        setShowOnboarding(true);
      }
    } catch (err: unknown) {
      console.error("🔍 Authentication error:", err);
      const error = err as { response?: { data?: { message?: string } } };

      let errorMessage = "Authentication failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage =
          "Invalid email or password. Please check your credentials.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid input. Please check your email and password.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password
    router.push("/app/auth/forgot-password");
  };

  const handleOnboardingComplete = () => {
    // Initialize shortlist for tenant users
    if (newUser?.role === "tenant") {
     
      dispatch(fetchShortlist());
    }

    // Redirect to appropriate dashboard
    redirectAfterLogin(newUser, router);
  };

  // Show onboarding flow for new users
  if (showOnboarding && newUser) {
    return (
      <OnboardingFlow
        user={newUser}
        onComplete={handleOnboardingComplete}
        isGoogleAuth={isGoogleAuth}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-0 left-0 w-full h-full"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-black mb-4">:: TADA</div>
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
          <div className="w-full">
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
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
              Continue with Google
            </button>
          </div>

          {/* Terms & Privacy */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By clicking Continue with Google, you agree to Tada{" "}
              <Link href="/terms" className="underline">
                Term&apos;s of Use
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
