"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setUser,
  logout,
  setOnboardingCompleted,
} from "@/store/slices/authSlice";
import { AppDispatch } from "@/store/store";
import { setAnalyticsUser } from "@/lib/analytics/ga";
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
        // One retry on a non-401 failure. A 502 during a backend deploy or a
        // network blip used to resolve the session gate with no user — every
        // guarded page then booted a genuinely signed-in visitor to the
        // landing. 401 is a real "not signed in" and is never retried.
        let response;
        try {
          response = await api.get("/auth/me");
        } catch (firstError: any) {
          if (firstError.response?.status === 401) {
            throw firstError;
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
          response = await api.get("/auth/me");
        }

        if (response.data && response.data.user) {
          dispatch(setUser({ user: response.data.user }));

          // Restoring a session re-binds the analytics identity but is NOT a
          // login: this runs on every page load, and only the OAuth callback
          // emits sign_up/login.
          setAnalyticsUser({
            id: response.data.user.id,
            role: response.data.user.role,
          });

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
