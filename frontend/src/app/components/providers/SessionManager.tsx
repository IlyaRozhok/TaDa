"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setUser,
  logout,
  setOnboardingCompleted,
} from "@/store/slices/authSlice";
import { AppDispatch } from "@/store/store";
import api from "../../lib/api";
import { fetchPreferencesOnce } from "@/store/api/preferences.api";

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

  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await api.get("/auth/me");

        if (response.data && response.data.user) {
          dispatch(setUser({ user: response.data.user }));
          console.log("Session restored for:", response.data.user.email);

          if (response.data.user.role === "tenant" || response.data.user.role === "admin") {
            // The shortlist is no longer prefetched here: the RTK Query hook
            // loads it when a screen that shows hearts mounts.
            if (!response.data.user.onboardingCompleted) {
              try {
                const preferences = await fetchPreferencesOnce();
                if (preferences && preferences.id) {
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
        sessionManagerResolve?.();
      }
    };

    initSession();
  }, [dispatch]);

  return null;
}
