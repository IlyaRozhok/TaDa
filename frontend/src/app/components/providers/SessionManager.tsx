"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  setUser,
  logout,
  setOnboardingCompleted,
} from "../../store/slices/authSlice";
import { fetchShortlist } from "../../store/slices/shortlistSlice";
import { AppDispatch } from "../../store/store";
import api, { preferencesAPI } from "../../lib/api";

// Global promise for session initialization
let sessionManagerPromise: Promise<void> | null = null;
let sessionManagerResolve: (() => void) | null = null;

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
        const response = await api.get("/auth/me");

        if (response.data && response.data.user) {
          dispatch(setUser({ user: response.data.user }));
          console.log("Session restored for:", response.data.user.email);

          if (response.data.user.role === "tenant" || response.data.user.role === "admin") {
            dispatch(fetchShortlist());

            if (!response.data.user.onboardingCompleted) {
              try {
                const prefsResponse = await preferencesAPI.get();
                if (prefsResponse.data && prefsResponse.data.id) {
                  dispatch(setOnboardingCompleted(true));
                }
              } catch {
                // No preferences — user needs to complete onboarding
              }
            }
          }
        }
      } catch (error: any) {
        console.log("Session check failed:", error.response?.status);
        if (error.response?.status === 401) {
          dispatch(logout());
        }
      } finally {
        setIsInitialized(true);
        sessionManagerResolve?.();
      }
    };

    initSession();
  }, [dispatch]);

  return null;
}
