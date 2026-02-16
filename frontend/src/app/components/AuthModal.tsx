"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setAuth, selectIsAuthenticated } from "../store/slices/authSlice";
import { fetchShortlist } from "../store/slices/shortlistSlice";
import { AppDispatch } from "../store/store";
import { authAPI } from "../lib/api";
import { redirectAfterLogin } from "../utils/simpleRedirect";
import { useAuthContext } from "../contexts/AuthContext";
import { ApiError } from "../types/api";
import { Loader2, Eye, EyeOff, Mail, Lock, X } from "lucide-react";
import { Button } from "@/shared/ui/Button/Button";
import { useTranslation } from "../hooks/useTranslation";
import { loginKeys } from "../lib/translationsKeys/loginTranslationKeys";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useTranslation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authContext = useAuthContext();

  // Close modal on authentication success
  useEffect(() => {
    if (isAuthenticated) {
      onClose();
      // Let the auth system handle the redirect
    }
  }, [isAuthenticated, onClose]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Close modal on backdrop click
  useEffect(() => {
    const handleBackdropClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleBackdropClick);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleBackdropClick);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setError("");
    setRememberMe(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

        // Success - login completed
        dispatch(
          setAuth({
            user: loginResponse.data.user,
            accessToken: loginResponse.data.access_token,
          }),
        );

        // Initialize shortlist for tenant and admin users
        if (loginResponse.data.user?.role === "tenant" || loginResponse.data.user?.role === "admin") {
          dispatch(fetchShortlist());
        }

        handleClose();
        await redirectAfterLogin(loginResponse.data.user, router);
      } else {
        // User doesn't exist - show error
        throw new Error(
          "Account not found. Please check your email or create a new account.",
        );
      }
    } catch (err: unknown) {
      console.error("🔍 AuthModal authentication error:", err);
      const error = err as ApiError;

      let errorMessage = "Authentication failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage =
          "Invalid email or password. Please check your credentials.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid input. Please check your email and password.";
      } else if (error.response?.status && error.response.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
    console.log("🔍 AuthModal - Google Auth button clicked");
    console.log("🔍 Redirecting to:", `${apiUrl}/auth/google`);
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password
    handleClose();
    router.push("/app/auth/forgot-password");
  };

  if (!isOpen) return null;

  // Credentials Step
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred backdrop that shows the underlying page */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img src="/black-logo.svg" alt="TADA Logo" className="h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t(loginKeys.page.title)}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            {error.includes("created with Google") && (
              <p className="text-red-600 text-sm mt-2">
                👆 Please use the Google button below to sign in.
              </p>
            )}
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
            className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-medium"
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
          <span className="px-4 text-sm text-gray-500">Or continue with</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all group"
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
            <span className="text-gray-700 font-medium group-hover:text-gray-900">
              {t(loginKeys.google.text)}
            </span>
          </button>
        </div>

        {/* Terms & Privacy */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By clicking {t(loginKeys.google.text)}, you agree to Tada{" "}
            <a href="/terms" className="underline">
              {t(loginKeys.footerTermsOfUse)}
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline">
              {t(loginKeys.terms.text)}
            </a>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t(loginKeys.page.desText)}
          </p>
        </div>
      </div>
    </div>
  );
}
