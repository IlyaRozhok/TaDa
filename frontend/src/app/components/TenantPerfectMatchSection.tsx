"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface TenantPerfectMatchSectionProps {
  hasPreferences: boolean;
  preferencesCount: number;
}

export default function TenantPerfectMatchSection({
  hasPreferences,
  preferencesCount,
}: TenantPerfectMatchSectionProps) {
  const router = useRouter();

  return (
    <section className="bg-gray-50 rounded-3xl px- py-12 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Let's Find Your Perfect Match
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl">
            {hasPreferences
              ? `Great! You have ${preferencesCount} preferences set. We're finding the best matches for you.`
              : "To get the most accurate matches for your rental search, we need to know more about your preferences. Complete your profile to unlock full access."}
          </p>

          <button
            onClick={() => router.push("/app/preferences")}
            className="bg-black text-white cursor-pointer px-8 py-3 rounded-3xl font-semibold hover:bg-gray-800 transition-colors"
          >
            {hasPreferences ? "Update Preferences" : "Complete Preferences"}
          </button>
        </div>

        {/* Illustration */}
        <div className="hidden lg:block">
          <img
            src="/tenant-dashboard-door.png"
            alt="Perfect Match Illustration"
            className="w-64 h-auto"
            onError={(e) => {
              // Fallback if image doesn't exist
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      </div>
    </section>
  );
}
