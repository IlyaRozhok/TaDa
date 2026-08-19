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
 * so on staging, previews and locally the gtag.js script is never even
 * requested. Consent is not part of that chain: under Consent Mode v2 the tag
 * loads for every production visitor with all four signals denied, and the
 * banner's answer reaches it later as a `consent update`. See `ga.ts`.
 *
 * `enabled` is state rather than a value read during render because it depends
 * on `window.location.hostname`, which the server does not have — reading it
 * while rendering makes the first client render disagree with the server's. The
 * effect also runs `initAnalytics` *before* the `<Script>` is mounted, so the
 * all-denied `consent default` is already queued in the dataLayer by the time
 * gtag.js arrives and starts draining it.
 *
 * Sits inside `ReduxProvider` because it reads the auth slice.
 */
export default function AnalyticsProvider() {
  const user = useSelector(selectUser);
  const [enabled, setEnabled] = useState(false);
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  useEffect(() => {
    if (!isAnalyticsEnabled()) {
      return;
    }

    initAnalytics();
    setEnabled(true);

    // The banner does not talk to gtag itself: it stores the decision and
    // announces it. This is what turns that announcement into a consent
    // update, both in this tab and when another tab is the one that answered.
    return subscribeToConsentChanges(syncAnalyticsConsent);
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
