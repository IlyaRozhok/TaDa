"use client";

import NewPreferencesPage from "@/app/components/preferences/NewPreferencesPage";
import TenantUniversalHeader from "@/app/components/TenantUniversalHeader";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function PreferencesPageRoute() {
  const searchParams = useSearchParams();

  // Clear saved step when entering preferences page (standalone, not from onboarding)
  useEffect(() => {
    // Always clear preferences step when on standalone preferences page
    localStorage.removeItem("preferencesStep");
  }, []);

  // Clear step when leaving the page
  useEffect(() => {
    return () => {
      // Cleanup: clear step when component unmounts (user leaves page)
      localStorage.removeItem("preferencesStep");
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader
        preferencesCount={0}
        showBackButton={false}
        showPreferencesButton={false}
        showSaveButton={false}
        showTenantCvLink={true}
      />

      <NewPreferencesPage currentStepOffset={0} totalSteps={11} />
    </div>
  );
}
