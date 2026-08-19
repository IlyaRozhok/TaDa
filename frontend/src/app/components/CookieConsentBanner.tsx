"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  CONSENT_REOPEN_EVENT,
  hasConsentDecision,
  persistConsentDecision,
  type CookieConsentDecision,
} from "@/lib/analytics/consent";
import {
  translateWithFallback,
  useTranslation,
} from "../hooks/useTranslation";

/**
 * The cookie consent banner.
 *
 * Previously lived inline in the landing page and was shown to signed-out
 * visitors only. It is mounted from the root layout now: the funnel GA4
 * measures happens after sign-in, so a banner the signed-in half of the
 * audience never saw could never be answered by them.
 *
 * Binary, one non-essential category: Accept all grants the four Consent Mode
 * v2 signals, Reject non-essential denies them. It does not touch gtag itself —
 * it stores the decision and `AnalyticsProvider` turns that into a consent
 * update.
 *
 * Asked once. Once a decision is stored the banner stays down on every later
 * visit, whichever way the user answered; the only way back is the
 * `CONSENT_REOPEN_EVENT` the privacy page dispatches.
 */
export default function CookieConsentBanner() {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [decided, setDecided] = useState(true);

  const label = useCallback(
    (key: string, fallback: string) => translateWithFallback(t, key, fallback),
    [t],
  );

  // Storage is browser-only, so the first render must not depend on it.
  useEffect(() => {
    const answered = hasConsentDecision();

    setDecided(answered);
    setOpen(!answered);
  }, []);

  useEffect(() => {
    const onReopen = () => setOpen(true);

    window.addEventListener(CONSENT_REOPEN_EVENT, onReopen);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, onReopen);
  }, []);

  const decide = useCallback((decision: CookieConsentDecision) => {
    persistConsentDecision(decision);
    setDecided(true);
    setOpen(false);
  }, []);

  const handleAccept = useCallback(() => decide("accepted"), [decide]);
  const handleReject = useCallback(() => decide("rejected"), [decide]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      // Dismissing an unanswered banner is a refusal, not a deferral: the
      // signals stay denied either way, so record the rejection and stop
      // waiting. Once a decision exists, Escape only closes the panel.
      if (decided) {
        setOpen(false);
      } else {
        handleReject();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, decided, handleReject]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-2 z-[100] flex justify-end px-4">
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-consent-title"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-200"
      >
        <div className="p-6 sm:p-7">
          <h2
            id="cookie-consent-title"
            className="text-xl font-semibold text-gray-900"
          >
            {t("cookies.title")}
          </h2>
          <p className="mt-2 text-gray-800">{t("cookies.description")}</p>
          <p className="mt-2 text-gray-800">
            {label(
              "cookies.analytics.notice",
              "Analytics and advertising cookies help us understand how the platform is used. Nothing is stored on your device until you accept, and you can change your choice at any time in our Privacy Policy.",
            )}
          </p>

          <div className="mt-6 flex items-center gap-6 flex-wrap">
            <button
              type="button"
              onClick={handleAccept}
              className="bg-black cursor-pointer text-white px-10 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              {label("cookies.button.accept", "Accept all")}
            </button>

            <button
              type="button"
              onClick={handleReject}
              className="text-gray-900 cursor-pointer font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-md px-2 py-1"
            >
              {label("cookies.button.reject", "Reject non-essential")}
            </button>

            <Link
              href="/privacy"
              className="text-gray-600 hover:text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-md px-2 py-1"
            >
              {label("cookies.link.privacy", "Privacy Policy")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
