"use client";

import NewPreferencesPage from "@/app/components/preferences/NewPreferencesPage";
import TenantUniversalHeader from "@/app/components/TenantUniversalHeader";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function PreferencesPageRoute() {
  const searchParams = useSearchParams();
  const [currentStepOffset, setCurrentStepOffset] = useState(0);

  useEffect(() => {
    // Check if coming from onboarding
    const fromOnboarding = searchParams.get('from') === 'onboarding';

    if (fromOnboarding) {
      // Clear any existing saved step immediately when coming from onboarding
      localStorage.removeItem('preferencesStep');
      setCurrentStepOffset(3); // PREFERENCES_START_STEP - 1 = 4 - 1 = 3
    } else {
      // Check if we have a saved step (indicates previous onboarding context)
      const savedStep = localStorage.getItem('preferencesStep');
      if (savedStep) {
        const parsedStep = parseInt(savedStep, 10);
        // If saved step is in onboarding range (4+), apply offset
        if (parsedStep >= 4) {
          setCurrentStepOffset(3);
        } else {
          setCurrentStepOffset(0);
        }
      } else {
        setCurrentStepOffset(0); // No saved progress - start from beginning
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader
        preferencesCount={0}
        showBackButton={false}
        showPreferencesButton={false}
        showSaveButton={false}
        showTenantCvLink={false}
      />

      <NewPreferencesPage currentStepOffset={currentStepOffset} />
    </div>
  );
}
