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
import { redirectAfterLogin } from "../../utils/simpleRedirect";

// Simple flag to prevent multiple init attempts
let sessionManagerInitialized = false;

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
        // Prevent multiple init attempts
        if (isRestoring || sessionManagerInitialized) {
          setIsInitialized(true);
          setShowGlobalLoader(false);
          return;
        }

        setIsRestoring(true);
        setLoadingMessage("Checking session...");

        // Check for stored token
        const token = localStorage.getItem("accessToken");
        const storedExpiry = localStorage.getItem("sessionExpiry");

        if (!token) {
          sessionManagerInitialized = true;
          setIsInitialized(true);
          setShowGlobalLoader(false);
          return;
        }

        // Check if session expired
        if (storedExpiry && Date.now() > parseInt(storedExpiry)) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("sessionExpiry");
          dispatch(logout());
          sessionManagerInitialized = true;
          setIsInitialized(true);
          setShowGlobalLoader(false);
          return;
        }

        setLoadingMessage("Validating token...");

        // Validate token with backend
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
          throw new Error(`Token invalid: ${response.status}`);
        }

        const apiResponse = await response.json();
        const userData = apiResponse.user;

        // Restore session
        dispatch(
          restoreSession({
            user: userData,
            accessToken: token,
          })
        );

        setShowGlobalLoader(false);

        // Simple redirect after login
        redirectAfterLogin(userData, router);
      } catch (error: any) {
        // Token invalid, clear it
        console.error("Token invalid:", error.message);
        
        localStorage.removeItem("accessToken");
        localStorage.removeItem("sessionExpiry");
        dispatch(logout());
        setShowGlobalLoader(false);
      } finally {
        setIsRestoring(false);
        sessionManagerInitialized = true;
        setIsInitialized(true);
      }
    };

    // Run once on mount
    if (!sessionManagerInitialized && !isRestoring) {
      restoreAuthState();
    } else {
      setIsInitialized(true);
      setShowGlobalLoader(false);
    }
  }, [dispatch, isAuthenticated, isRestoring]);

  // Export initialization status for other components
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
