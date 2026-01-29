"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  setAuth,
  logout,
  setOnboardingCompleted,
} from "../../store/slices/authSlice";
import { fetchShortlist } from "../../store/slices/shortlistSlice";
import { AppDispatch } from "../../store/store";
import api, { preferencesAPI } from "../../lib/api";

// Global promise for session initialization
let sessionManagerPromise: Promise<void> | null = null;
let sessionManagerResolve: (() => void) | null = null;

// Create a global promise that resolves when SessionManager is ready
if (typeof window !== "undefined") {
  sessionManagerPromise = new Promise((resolve) => {
    sessionManagerResolve = resolve;
  });
}

export function waitForSessionManager(): Promise<void> {
  return sessionManagerPromise || Promise.resolve();
}

export default function SessionManager() {
  const dispatch = useDispatch<AppDispatch>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          console.log("No token found");
          setIsInitialized(true);
          sessionManagerResolve?.();
          return;
        }

        // Validate token with backend
        try {
          const response = await api.get("/auth/me");

          if (response.data && response.data.user) {
            dispatch(
              setAuth({
                user: response.data.user,
                accessToken: token,
              }),
            );
            console.log("Session restored for:", response.data.user.email);

            // Initialize shortlist for tenant users
            if (response.data.user.role === "tenant") {
              dispatch(fetchShortlist());

              // Check if tenant has preferences to set onboardingCompleted flag
              // This is for backward compatibility with existing users
              if (!response.data.user.onboardingCompleted) {
                try {
                  const prefsResponse = await preferencesAPI.get();
                  if (prefsResponse.data && prefsResponse.data.id) {
                    // User has preferences, mark onboarding as completed
                    dispatch(setOnboardingCompleted(true));
                  }
                } catch (error: any) {
                  // No preferences found - user needs to complete onboarding
                  // onboardingCompleted remains false
                }
              }
            }
          }
        } catch (error: any) {
          console.log("Token validation failed:", error.response?.status);

          // Clear invalid token
          if (error.response?.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("sessionExpiry");
            dispatch(logout());
          }
        }
      } catch (error) {
        console.error("Session initialization error:", error);
      } finally {
        setIsInitialized(true);
        sessionManagerResolve?.();
      }
    };

    initSession();
  }, [dispatch]);

  // No loading UI - just manage session in background
  return null;
}
