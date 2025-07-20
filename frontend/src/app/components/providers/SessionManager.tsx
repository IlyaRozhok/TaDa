"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { authAPI } from "../../lib/api";
import {
  restoreSession,
  logout,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";
import GlobalLoader from "../GlobalLoader";
import WelcomeManager from "../WelcomeManager";
import { getUserRole } from "../DashboardRouter";
import { authLogger } from "../../services/authLogger";
import { authErrorHandler } from "../../services/authErrorHandler";

// Global flag to track SessionManager initialization
let sessionManagerInitialized = false;
let sessionManagerPromise: Promise<void> | null = null;
let lastRedirectTime = 0;
const REDIRECT_COOLDOWN = 1000; // 1 second cooldown between redirects

export default function SessionManager() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showGlobalLoader, setShowGlobalLoader] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");

  useEffect(() => {
    const restoreAuthState = async () => {
      try {
        // Prevent multiple simultaneous restoration attempts
        if (isRestoring || sessionManagerInitialized) {
          setIsInitialized(true);
          setShowGlobalLoader(false);
          return;
        }

        authLogger.info("Starting session restoration", "session_restore");
        setIsRestoring(true);
        setLoadingMessage("Restoring your session...");

        // Check if we have a token in localStorage
        const token = localStorage.getItem("accessToken");
        const storedExpiry = localStorage.getItem("sessionExpiry");

        if (!token) {
          authLogger.info(
            "No access token found in localStorage",
            "session_restore"
          );
          sessionManagerInitialized = true;
          setIsInitialized(true);
          setShowGlobalLoader(false);
          handlePostInitialization(false);
          return;
        }

        // console.log(
        // "🔐 SessionManager: Found access token:",
        // token.slice(0, 20) + "..."
        // );
        setLoadingMessage("Validating session...");

        // Check if session has expired locally
        if (storedExpiry && Date.now() > parseInt(storedExpiry)) {
          authLogger.warning(
            "Session expired locally, clearing",
            "session_restore",
            {
              expiredAt: new Date(parseInt(storedExpiry)).toISOString(),
            }
          );
          localStorage.removeItem("accessToken");
          localStorage.removeItem("sessionExpiry");
          dispatch(logout());
          sessionManagerInitialized = true;
          setIsInitialized(true);
          setShowGlobalLoader(false);
          handlePostInitialization(false);
          return;
        }

        // console.log("🔐 SessionManager: Validating token with backend...");
        setLoadingMessage("Verifying credentials...");

        // Validate token with backend - use fetch directly to avoid interceptor loops
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
          }/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const apiResponse = await response.json();
        const userData = apiResponse.user; // Extract user from API response
        authLogger.success("Token validation successful", "session_restore", {
          user_id: userData.id,
          user_email: userData.email,
          user_role: userData.role,
        });
        setLoadingMessage("Welcome back!");

        // If valid, restore the session
        dispatch(
          restoreSession({
            user: userData,
            accessToken: token,
          })
        );

        authLogger.success("Session restored successfully", "session_restore");

        // Small delay to ensure Redux state is updated
        await new Promise((resolve) => setTimeout(resolve, 300));

        setShowGlobalLoader(false);
        handlePostInitialization(true, userData);
      } catch (error: any) {
        // If token is invalid or expired, clear it
        const authError = authErrorHandler.handleSessionError(error);
        authLogger.error("Session restoration failed", "session_restore", {
          error: authError.message,
          statusCode: authError.statusCode,
          details: authError.details,
        });

        // Clear invalid token
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("sessionExpiry");
        }

        // Only dispatch logout if we're not already logged out
        if (isAuthenticated) {
          // console.log(
          //   "🔐 SessionManager: Dispatching logout due to invalid session"
          // );
          dispatch(logout());
        }

        setShowGlobalLoader(false);
        handlePostInitialization(false);
      } finally {
        setIsRestoring(false);
        sessionManagerInitialized = true;
        setIsInitialized(true);
        // console.log("SessionManager: Initialization complete");
      }
    };

    // Only run once on mount
    if (!sessionManagerInitialized && !isRestoring) {
      sessionManagerPromise = restoreAuthState();
    } else if (sessionManagerInitialized) {
      setIsInitialized(true);
      setShowGlobalLoader(false);
    }
  }, [dispatch, isAuthenticated, isRestoring]);

  // Handle post-initialization redirects
  const handlePostInitialization = (
    isUserAuthenticated: boolean,
    userData?: any
  ) => {
    if (typeof window === "undefined") return;

    // Define public paths
    const publicPaths = [
      "/",
      "/auth/login",
      "/auth/register",
      "/app/auth",
      "/app/auth/login",
      "/app/auth/register",
    ];
    const isPublicPath = publicPaths.includes(pathname);

    // Define protected paths that should not redirect authenticated users
    const protectedPaths = [
      "/app/shortlist",
      "/app/preferences",
      "/app/matches",
      "/app/properties",
    ];
    const isProtectedPath = protectedPaths.some((path) =>
      pathname.startsWith(path)
    );

    const userRole = userData ? getUserRole(userData) : "unknown";

    console.log("🔄 SessionManager: Handling post-init redirect", {
      isUserAuthenticated,
      pathname,
      isPublicPath,
      userRole,
    });

    // Check cooldown to prevent rapid redirects
    const now = Date.now();
    if (now - lastRedirectTime < REDIRECT_COOLDOWN) {
      console.log("🔄 SessionManager: Redirect cooldown active, skipping");
      return;
    }

    if (isUserAuthenticated) {
      // User is logged in
      if (isPublicPath) {
        // Redirect away from public pages to a general dashboard path
        // Let DashboardRouter handle the specific dashboard routing
        console.log(
          "🔄 SessionManager: Redirecting authenticated user to dashboard"
        );
        lastRedirectTime = now;
        router.replace("/app/dashboard");
      } else if (isProtectedPath) {
        // User is on a protected page, stay there
        console.log("🔄 SessionManager: User on protected path, staying put", {
          pathname,
        });
      }
      // If on other pages, stay there - let individual pages handle their own logic
    } else {
      // User is not logged in
      if (!isPublicPath && !pathname.startsWith("/app/auth/")) {
        // Redirect to login if on protected page
        console.log(
          "🔄 SessionManager: Redirecting unauthenticated user to login"
        );
        lastRedirectTime = now;
                  router.replace("/app/auth");
      }
      // If on public page, stay there
    }
  };

  // Export initialization status for other components to use
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__sessionManagerInitialized = isInitialized;
    }
  }, [isInitialized]);

  return (
    <>
      <GlobalLoader isLoading={showGlobalLoader} message={loadingMessage} />
      <WelcomeManager />
    </>
  );
}

// Export function to wait for session manager initialization
export const waitForSessionManager = (): Promise<void> => {
  if (sessionManagerInitialized) {
    return Promise.resolve();
  }

  if (sessionManagerPromise) {
    return sessionManagerPromise;
  }

  // If no promise exists, create one that polls for initialization
  return new Promise((resolve) => {
    const checkInitialized = () => {
      if (sessionManagerInitialized) {
        resolve();
      } else {
        setTimeout(checkInitialized, 50);
      }
    };
    checkInitialized();
  });
};
