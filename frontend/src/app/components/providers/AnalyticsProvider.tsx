"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useSelector } from "react-redux";

import { selectUser } from "@/store/slices/authSlice";
import { subscribeToConsentChanges } from "@/lib/analytics/consent";
import {
  initAnalytics,
  isAnalyticsEnabled,
  setAnalyticsUser,
  syncAnalyticsConsent,
} from "@/lib/analytics/ga";

/**
 * Loads GA4 and keeps it bound to the signed-in user.
 *
 * Renders nothing and loads nothing unless the guard chain in `ga.ts` passes,
 * so on staging, previews, locally, and — since analytics consent joined that
 * chain — for anyone who has not pressed Accept in the cookie banner, the
 * gtag.js script is never even requested.
 *
 * `enabled` is state rather than a value read during render because it depends
 * on browser-only inputs (hostname, stored consent): the server has neither, so
 * reading them while rendering would make the first client render disagree with
 * the server's. It is resolved in an effect instead, and re-resolved whenever
 * the stored decision changes, which is what makes Accept take effect
 * immediately rather than on the next navigation.
 *
 * Sits inside `ReduxProvider` because it reads the auth slice.
 */
export default function AnalyticsProvider() {
  const user = useSelector(selectUser);
  const [enabled, setEnabled] = useState(false);
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  useEffect(() => {
    const apply = () => {
      syncAnalyticsConsent();
      setEnabled(isAnalyticsEnabled());
    };

    apply();

    return subscribeToConsentChanges(apply);
  }, []);

  // Follows every auth state change, so a sign-out clears the id and a role
  // change re-gates the funnel events. Only the internal UUID is sent.
  // Re-runs when consent turns the tag on, so a user who accepts mid-session
  // is still bound to their id.
  useEffect(() => {
    if (enabled) {
      initAnalytics();
    }

    setAnalyticsUser(user ? { id: user.id, role: user.role } : null);
  }, [user, enabled]);

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
