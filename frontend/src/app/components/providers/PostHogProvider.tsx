"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";

import { selectUser } from "@/store/slices/authSlice";
import { subscribeToConsentChanges } from "@/lib/analytics/consent";
import { setReplayUser, syncSessionReplay } from "@/lib/analytics/posthog";

/**
 * Starts and stops PostHog Session Replay.
 *
 * Renders nothing, ever — posthog-js is an npm dependency behind a dynamic
 * import rather than a `<Script>` tag, so there is no markup to emit. It also
 * loads nothing unless the five-condition guard chain in `posthog.ts` passes,
 * which means the chunk is never fetched on staging, on previews, locally, or
 * for a visitor who has not accepted the cookie banner.
 *
 * Sits beside `AnalyticsProvider` rather than inside it: the two answer to
 * different rules. GA4 loads for every production visitor and lets Consent Mode
 * v2 decide what it may store; replay is strict opt-in and tenant-only, because
 * a recording has no cookieless mode and a back-office recording would capture
 * third parties. The reasoning is written out in full in `posthog.ts` — read it
 * before making the two providers agree.
 *
 * Effects, not render-time work: the gate reads `window.location.hostname`,
 * which the server does not have, and both branches must run only on the client.
 *
 * CSP: none exists in this app today (no middleware, no `headers()` in
 * `next.config.ts`). A future one has to allow `*.i.posthog.com` in `script-src`,
 * `connect-src` and `worker-src` — the rrweb recorder is fetched from the ingest
 * host at runtime, not bundled.
 *
 * Sits inside `ReduxProvider` because it reads the auth slice.
 */
export default function PostHogProvider() {
  const user = useSelector(selectUser);

  // The banner does not talk to posthog itself: it stores the decision and
  // announces it. This turns that announcement into a start, or into a stop when
  // the answer is withdrawn — in this tab and when another tab answered.
  useEffect(() => subscribeToConsentChanges(syncSessionReplay), []);

  // Follows every auth state change. A sign-in by a tenant is what starts a
  // recording; a sign-out, or a session belonging to any other role, stops it.
  // Only the internal UUID is sent as the distinct id.
  useEffect(() => {
    void setReplayUser(user ? { id: user.id, role: user.role } : null);
  }, [user]);

  return null;
}
