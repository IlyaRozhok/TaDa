"use client";

import React, { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/app/hooks/usePreferences";
import { waitForSessionManager } from "@/app/components/providers/SessionManager";
import { getRedirectPath } from "@/app/utils/simpleRedirect";
import {
  LocationStep,
  CommuteTimeStep,
  BudgetStep,
  PropertyTypeStep,
  ApartmentSpecStep,
  MultiSelectStep,
  PersonalPreferencesStep,
  AboutYouStep,
  PetsStep,
  AmenitiesStep,
  CompleteProfileStep,
  LivingEnvironmentStep,
} from "./steps";
import {
  BUILDING_STYLE_OPTIONS,
  LIFESTYLE_OPTIONS,
  SOCIAL_OPTIONS,
  WORK_STUDY_OPTIONS,
  CONVENIENCE_FEATURES_OPTIONS,
  PET_FRIENDLY_OPTIONS,
  LUXURY_PREMIUM_OPTIONS,
  IDEAL_LIVING_OPTIONS,
  SMOKING_OPTIONS,
  TOTAL_STEPS_NEW as TOTAL_STEPS,
} from "@/app/constants/preferences";

interface NewPreferencesPageProps {
  onComplete?: () => void;
  currentStepOffset?: number; // Offset to add to the internal step count for unified progress
  totalSteps?: number; // Total steps in unified flow
  onNext?: () => void; // External next handler (deprecated)
  onPrevious?: () => void; // External previous handler (deprecated)
  externalStep?: number; // External step control for onboarding
  externalNext?: () => void; // External next handler for onboarding
  externalPrevious?: () => void; // External previous handler for onboarding
  showNavigation?: boolean; // Whether to show internal navigation
  onValidationChange?: (isValid: boolean) => void; // Validation state callback
}

export default function NewPreferencesPage({
  onComplete,
  currentStepOffset = 0,
  totalSteps,
  onNext,
  onPrevious,
  externalStep,
  externalNext,
  externalPrevious,
  showNavigation = true,
  onValidationChange,
}: NewPreferencesPageProps = {}) {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(true);

  const {
    loading,
    step: internalStep,
    watchedData,
    updateField,
    toggleFeature,
    nextStep: internalNextStep,
    prevStep: internalPrevStep,
    savePreferences,
    isLastStep: internalIsLastStep,
    isFirstStep: internalIsFirstStep,
    user,
    isAuthenticated,
  } = usePreferences(currentStepOffset);

  // Use external step control if provided (for onboarding), otherwise use internal
  const step = externalStep || internalStep;
  const nextStep = externalNext || internalNextStep;
  const prevStep = externalPrevious || internalPrevStep;
  const isLastStep = externalStep ? (step === 10) : internalIsLastStep; // For external control, last step is 10
  const isFirstStep = externalStep ? (step === 1) : internalIsFirstStep;

  // Pass validation state to parent when step 10 validation changes
  useEffect(() => {
    if (onValidationChange && step === 10) {
      onValidationChange(isCurrentStepValid);
    }
  }, [isCurrentStepValid, onValidationChange, step]);

  // Wait for session manager to initialize
  useEffect(() => {
    const initializeSession = async () => {
      try {
        await waitForSessionManager();
        setSessionReady(true);
      } catch (error) {
        console.error("Failed to initialize session:", error);
        setSessionReady(true);
      }
    };
    initializeSession();
  }, []);

  // Always allow access to preferences for any authenticated user (no redirects)
  useEffect(() => {
    if (hasCheckedAccess) return;
    if (sessionReady && isAuthenticated && user) {
      setHasCheckedAccess(true);
      setAccessDenied(false);
    }
  }, [sessionReady, isAuthenticated, user, hasCheckedAccess]);

  if (!sessionReady || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Skeleton */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-8 py-4">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-4xl mx-auto px-8 py-10">
          <div className="space-y-6">
            {/* Title Skeleton */}
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            
            {/* Form Fields Skeleton */}
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="w-full bg-gray-200 h-px"></div>
          <div className="p-8">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 w-24 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    // Should never happen now, but keep graceful fallback
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-4">
            Access Restricted
          </h1>
          <p className="text-gray-600 mb-6">
            Preferences are only available for tenant accounts.
          </p>
        </div>
      </div>
    );
  }

  const handleGoBack = () => {
    const path = getRedirectPath(user);
    router.replace(path);
  };

  const handleFinish = async () => {
    try {
      await savePreferences();
      console.log("✅ Preferences saved successfully");
      
      // Call onComplete callback if provided (for onboarding flow)
      if (onComplete) {
        onComplete();
      } else {
        // Default behavior: redirect to dashboard
        const path = getRedirectPath(user);
        router.replace(path);
      }
    } catch (error) {
      console.error("❌ Failed to save preferences:", error);
      // Silent error - no toast
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData: watchedData,
      onUpdate: updateField,
      onToggle: toggleFeature,
      onNext: nextStep,
      onPrevious: prevStep,
    };

    switch (step) {
      case 1:
        return <LocationStep {...stepProps} />;
      case 2:
        return <CommuteTimeStep {...stepProps} />;
      case 3:
        return <BudgetStep {...stepProps} />;
      case 4:
        return <PropertyTypeStep {...stepProps} />;
      case 5:
        return <ApartmentSpecStep {...stepProps} />;
      case 6:
        return <PetsStep {...stepProps} />;
      case 7:
        return <AmenitiesStep {...stepProps} />;
      case 8:
        return <CompleteProfileStep {...stepProps} />;
      case 9:
        return <LivingEnvironmentStep {...stepProps} />;
      case 10:
        return <AboutYouStep {...stepProps} onValidationChange={setIsCurrentStepValid} />;
      default:
        return <LocationStep {...stepProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 pb-32 pt-10">
        <form onSubmit={(e) => e.preventDefault()}>{renderStep()}</form>
      </div>

      {/* Bottom Navigation */}
      {showNavigation && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="py-4 px-8">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={isFirstStep}
                className={`font-medium ${
                  isFirstStep
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-black hover:text-gray-600 cursor-pointer"
                } transition-colors`}
              >
                Back
              </button>

              <div className="text-sm text-gray-500">
                Step {step + currentStepOffset} of {totalSteps || TOTAL_STEPS}
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (isLastStep) {
                    await handleFinish();
                  } else {
                    await nextStep();
                  }
                }}
                disabled={step === 10 && !isCurrentStepValid}
                className={`px-8 py-3 rounded-full font-medium transition-colors cursor-pointer ${
                  step === 10 && !isCurrentStepValid
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {isLastStep ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
