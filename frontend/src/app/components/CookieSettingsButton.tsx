"use client";

import { openCookieSettings } from "@/lib/analytics/consent";

import { translateWithFallback, useTranslation } from "../hooks/useTranslation";

/**
 * Reopens the cookie consent banner.
 *
 * The withdrawal route the privacy policy promises: the banner asks once, so
 * without this a stored decision would be unreachable.
 */
export default function CookieSettingsButton({
  className = "",
}: {
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className={`bg-black cursor-pointer text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${className}`}
    >
      {translateWithFallback(t, "cookies.settings.button", "Cookie settings")}
    </button>
  );
}
