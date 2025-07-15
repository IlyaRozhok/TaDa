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

// Global flag to track SessionManager initialization
let sessionManagerInitialized = false;
let sessionManagerPromise: Promise<void> | null = null;

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

        // console.log("🔐 SessionManager: Starting session restoration...");
        setIsRestoring(true);
        setLoadingMessage("Restoring your session...");

        // Check if we're in a browser environment
        if (typeof window === "undefined") {
          console.log(
            "🔐 SessionManager: Not in browser environment, skipping"
          );
          sessionManagerInitialized = true;
          setIsInitialized(true);
          setShowGlobalLoader(false);
          handlePostInitialization(false);
          return;
        }

        // Check if we have a token in localStorage
        const token = localStorage.getItem("accessToken");
        const storedExpiry = localStorage.getItem("sessionExpiry");

        if (!token) {
          // console.log(
          // "🔐 SessionManager: No access token found in localStorage"
          // );
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
          // console.log(
          //   "🔐 SessionManager: Session expired locally, clearing..."
          // );
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
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
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
        // console.log("✅ SessionManager: Token validation successful", userData);
        setLoadingMessage("Welcome back!");

        // If valid, restore the session
        dispatch(
          restoreSession({
            user: userData,
            accessToken: token,
          })
        );

        // console.log("✅ SessionManager: Session restored successfully");

        // Small delay to ensure Redux state is updated
        await new Promise((resolve) => setTimeout(resolve, 300));

        setShowGlobalLoader(false);
        handlePostInitialization(true, userData);
      } catch (error: any) {
        // If token is invalid or expired, clear it
        console.error("❌ SessionManager: Session restoration failed:", {
          status: error?.status,
          message: error?.message,
          error: error,
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
      "/app/auth/login",
      "/app/auth/register",
    ];
    const isPublicPath = publicPaths.includes(pathname);

    // console.log("🔄 SessionManager: Handling post-init redirect", {
    //   isUserAuthenticated,
    //   pathname,
    //   isPublicPath,
    //   userRole: userData?.is_operator ? "operator" : "tenant",
    // });

    if (isUserAuthenticated) {
      // User is logged in
      if (isPublicPath) {
        // Redirect away from public pages to appropriate dashboard
        const dashboardPath = userData?.roles?.includes("operator")
          ? "/app/dashboard/operator"
          : "/app/dashboard/tenant";
        console.log(
          "🔄 SessionManager: Redirecting authenticated user to dashboard:",
          dashboardPath
        );
        router.replace(dashboardPath);
      }
      // If on a protected page, stay there
    } else {
      // User is not logged in
      if (!isPublicPath && !pathname.startsWith("/app/auth/")) {
        // Redirect to login if on protected page
        console.log(
          "🔄 SessionManager: Redirecting unauthenticated user to login"
        );
        router.replace("/app/auth/login");
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
