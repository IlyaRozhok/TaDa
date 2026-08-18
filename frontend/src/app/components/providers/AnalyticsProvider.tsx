"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useSelector } from "react-redux";

import { selectUser } from "@/store/slices/authSlice";
import {
  initAnalytics,
  isAnalyticsEnabled,
  setAnalyticsUser,
} from "@/lib/analytics/ga";

/**
 * Loads GA4 and keeps it bound to the signed-in user.
 *
 * Renders nothing and loads nothing unless the guard chain in `ga.ts` passes,
 * so on staging, previews and locally the gtag.js script is never even
 * requested.
 *
 * Sits inside `ReduxProvider` because it reads the auth slice.
 */
export default function AnalyticsProvider() {
  const user = useSelector(selectUser);
  const enabled = isAnalyticsEnabled();
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  useEffect(() => {
    initAnalytics();
  }, []);

  // Follows every auth state change, so a sign-out clears the id and a role
  // change re-gates the funnel events. Only the internal UUID is sent.
  useEffect(() => {
    setAnalyticsUser(user ? { id: user.id, role: user.role } : null);
  }, [user]);

  if (!enabled || !measurementId) {
    return null;
  }

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
    />
  );
}
