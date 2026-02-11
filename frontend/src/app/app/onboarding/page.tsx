"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { ChevronDown, ChevronLeft } from "lucide-react";
import {
  selectUser,
  selectIsAuthenticated,
  selectIsOnboarded,
  selectOnboardingCompleted,
  setIsOnboarded,
  setOnboardingCompleted,
} from "../../store/slices/authSlice";
import { preferencesAPI } from "../../lib/api";
import OnboardingProfileStep from "../../components/onboarding/OnboardingProfileStep";
import OnboardingIntroScreens from "../../components/onboarding/OnboardingIntroScreens";
import OnboardingIntroCenteredWrapper from "../../components/onboarding/OnboardingIntroCenteredWrapper";
import NewPreferencesPage from "../../components/preferences/NewPreferencesPage";
import UserDropdown from "../../components/UserDropdown";
import { waitForSessionManager } from "../../components/providers/SessionManager";
import {
  useOnboarding,
  TOTAL_ONBOARDING_STEPS,
  PROFILE_STEP,
  PREFERENCES_START_STEP,
} from "../../hooks/useOnboarding";
import { usePreferences } from "../../hooks/usePreferences";
import { useTranslation } from "../../hooks/useTranslation";
import { onboardingKeys } from "../../lib/translationsKeys/onboardingTranslationKeys";
import LanguageDropdown from "../../components/LanguageDropdown";

// Onboarding Header Component - uses same language as landing (saved in localStorage via I18nContext)
function OnboardingHeader() {

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 py-0.75 sm:py-1">
      <div className="max-w-4xl lg:max-w-none mx-auto flex items-center justify-between px-8 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <div className="flex items-center">
          <button className="transition-opacity hover:opacity-80 cursor-pointer">
            <img
              src="/black-logo.svg"
              alt="TADA Logo"
              className="h-6 sm:h-7 lg:h-8"
            />
          </button>
        </div>

        {/* Right: Language + Profile */}
        <div className="flex items-center space-x-0.75 sm:space-x-1">
          {/* Language Dropdown - same list as landing, persists via I18nContext/localStorage */}
          <LanguageDropdown variant="default" />

          {/* User Dropdown - Simplified */}
          <UserDropdown simplified={true} />
        </div>
      </div>
    </nav>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isOnboarded = useSelector(selectIsOnboarded);
  const onboardingCompleted = useSelector(selectOnboardingCompleted);
  const [loading, setLoading] = useState(true);
  const [isProfileValid, setIsProfileValid] = useState(false);
  const [isPreferencesValid, setIsPreferencesValid] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const hasCheckedPreferences = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    state,
    setCurrentStep,
    handleIntroComplete,
    handleProfileComplete,
    handlePreferencesComplete,
  } = useOnboarding(user, () => router.push("/app/tenant-cv"));

  // Handle profile completion with save
  const handleProfileNext = async () => {
    if (!isProfileValid || isProfileSaving) {
      return;
    }

    setIsProfileSaving(true);

    try {
      // Call the save function from the profile component
      if ((window as any).onboardingProfileSave) {
        const success = await (window as any).onboardingProfileSave();
        if (success) {
          // Set isOnboarded to true after profile is saved
          dispatch(setIsOnboarded(true));
          handleProfileComplete();
          // Scroll to top when transitioning to preferences
          scrollToTop();
        }
      } else {
        // Set isOnboarded to true even if save function doesn't exist
        dispatch(setIsOnboarded(true));
        handleProfileComplete();
        // Scroll to top when transitioning to preferences
        scrollToTop();
      }
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Only use preferences hook in preferences phase to avoid conflicts
  const preferencesHook = usePreferences(PREFERENCES_START_STEP - 1);

  // Helper function to scroll to top of content
  const scrollToTop = useCallback(() => {
    setTimeout(() => {
      const header = document.querySelector("nav");
      const headerHeight = header ? header.offsetHeight : 0;
      const offset = 0; // Start from absolute top of content container

      // Try to scroll the scrollable container first
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: offset,
          behavior: "instant",
        });
      } else {
        // Fallback to window scroll with header offset
        window.scrollTo({ top: headerHeight + 20, behavior: "instant" });
      }
    }, 200);
  }, []);

  // Sync onboarding step with preferences step
  useEffect(() => {
    if (state.currentPhase === "preferences") {
      const onboardingStep = PREFERENCES_START_STEP - 1 + preferencesHook.step;
      if (
        onboardingStep >= PREFERENCES_START_STEP &&
        onboardingStep <= TOTAL_ONBOARDING_STEPS
      ) {
        // Only update if different to avoid unnecessary re-renders
        if (onboardingStep !== state.currentStep) {
          setCurrentStep(onboardingStep);
          // Scroll to top when step changes
          scrollToTop();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesHook.step, state.currentPhase, scrollToTop]);

  const handlePreferencesNext = async () => {
    if (preferencesHook.isLastStep) {
      // Mark onboarding as fully completed
      dispatch(setOnboardingCompleted(true));
      await handlePreferencesComplete();
    } else {
      await preferencesHook.nextStep();
      // Scroll to top after step change
      scrollToTop();
    }
  };

  const handlePreferencesPrevious = async () => {
    if (!preferencesHook.isFirstStep) {
      await preferencesHook.prevStep();
      // Scroll to top after step change
      scrollToTop();
    }
  };

  // Wait for SessionManager to restore session before checking auth (avoids redirect loop)
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        await waitForSessionManager();
      } catch (error) {
        console.error("Failed to wait for session manager:", error);
      } finally {
        if (isMounted) {
          setSessionReady(true);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Check if user is authenticated and has preferences (only after session is ready)
  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    // Skip if already checked
    if (hasCheckedPreferences.current) {
      return;
    }

    const checkUserStatus = async () => {
      if (!isAuthenticated || !user) {
        router.push("/app/auth/login");
        return;
      }

      // Mark as checked to prevent re-checking
      hasCheckedPreferences.current = true;

      // Reset preferences step for new onboarding
      localStorage.removeItem("preferencesStep");

      // Check if user already has preferences AND is onboarded
      // Only redirect if both conditions are met to avoid redirect loops
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/app/auth/login");
          return;
        }

        const response = await preferencesAPI.get();
        if (response.data && response.data.id && onboardingCompleted) {
          // User has preferences AND completed full onboarding, redirect to tenant-cv
          router.push("/app/tenant-cv");
          return;
        }
        // If user has preferences but onboarding not completed, stay on onboarding
        // If user doesn't have preferences, stay on onboarding
      } catch (error: unknown) {
        // 404 means no preferences - user needs onboarding
        const errorResponse = error as { response?: { status?: number } };
        if (errorResponse.response?.status !== 404) {
          console.error("Error checking preferences:", error);
        }
        // Stay on onboarding if error (except 404)
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [sessionReady, isAuthenticated, user, onboardingCompleted, router]);

  if (!sessionReady || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (state.currentPhase === "intro") {
    return (
      <div className="min-h-screen bg-white">
        {/* Onboarding Header */}
        <OnboardingHeader />

        {/* Main Content - strictly centered in the container */}
        <div className="min-h-[calc(100vh-120px)] flex flex-col pb-24">
          <OnboardingIntroCenteredWrapper className="px-1 sm:px-1.5 lg:px-2">
            <div className="w-full max-w-4xl mx-auto">
              <OnboardingIntroScreens
                onComplete={handleIntroComplete}
                currentStep={state.currentStep}
                totalSteps={TOTAL_ONBOARDING_STEPS}
              />
            </div>
          </OnboardingIntroCenteredWrapper>
        </div>

        {/* Unified Bottom Navigation for intro phase */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-px">
            <div
              className="bg-black h-px transition-all duration-300"
              style={{
                width: `${(state.currentStep / TOTAL_ONBOARDING_STEPS) * 100}%`,
              }}
            />
          </div>

          <div className="py-2 px-8">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => {
                  if (state.currentStep > 1) {
                    setCurrentStep(state.currentStep - 1);
                  }
                }}
                disabled={state.currentStep <= 1}
                className={`text-sm sm:text-base font-medium transition-colors cursor-pointer ${
                  state.currentStep <= 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-black hover:text-gray-600"
                }`}
              >
                {t(onboardingKeys.bottom.prevButton)}
              </button>

              <div className="text-sm text-gray-500">
                {t(onboardingKeys.bottom.stepText)} {state.currentStep}{" "}
                {t(onboardingKeys.bottom.ofText)} {TOTAL_ONBOARDING_STEPS}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => {
                  if (state.currentStep < 3) {
                    setCurrentStep(state.currentStep + 1);
                  } else {
                    handleIntroComplete();
                  }
                }}
                className="bg-black cursor-pointer text-white px-8 mt-1 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                {t(onboardingKeys.bottom.nextButton)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Onboarding Header */}
      <OnboardingHeader />

      {/* Main Content */}
      <div ref={scrollContainerRef}>
        {state.currentPhase === "profile" ? (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-24 pb-24 sm:pb-28 lg:pb-32">
            <div className="w-full">
              <OnboardingProfileStep
                onComplete={handleProfileComplete}
                isLoading={state.isLoading}
                onNext={handleProfileNext}
                currentStep={state.currentStep}
                totalSteps={TOTAL_ONBOARDING_STEPS}
                onValidationChange={setIsProfileValid}
              />
            </div>
          </div>
        ) : (
          <NewPreferencesPage
            onComplete={handlePreferencesComplete}
            currentStepOffset={PREFERENCES_START_STEP - 1}
            totalSteps={TOTAL_ONBOARDING_STEPS}
            externalStep={preferencesHook.step}
            externalNext={handlePreferencesNext}
            externalPrevious={handlePreferencesPrevious}
            showNavigation={false}
            onValidationChange={setIsPreferencesValid}
          />
        )}
      </div>

      {/* Unified Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-px">
          <div
            className="bg-black h-px transition-all duration-300"
            style={{
              width: `${(state.currentStep / TOTAL_ONBOARDING_STEPS) * 100}%`,
            }}
          />
        </div>

        <div className="py-2 px-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => {
                if (state.currentPhase === "profile") {
                  // Go back to intro step 3
                  setCurrentStep(3);
                } else if (state.currentPhase === "preferences") {
                  if (preferencesHook.step === 1) {
                    // Go back to profile step
                    setCurrentStep(4);
                  } else {
                    // Go to previous preferences step
                    handlePreferencesPrevious();
                  }
                  // Scroll to top after navigation
                  scrollToTop();
                }
              }}
              className="text-base font-medium transition-colors text-black hover:text-gray-600 cursor-pointer"
            >
              {t(onboardingKeys.bottom.prevButton)}
            </button>

            <div className="text-sm text-gray-500">
              {t(onboardingKeys.bottom.stepText)} {state.currentStep} {t(onboardingKeys.bottom.ofText)} {TOTAL_ONBOARDING_STEPS}
            </div>

            {/* Next Button */}
            {state.currentPhase === "profile" && (
              <button
                type="button"
                onClick={handleProfileNext}
                disabled={state.isLoading || !isProfileValid || isProfileSaving}
                className={`px-8 py-3 rounded-full font-medium transition-all cursor-pointer flex items-center gap-2 bg-black text-white hover:bg-gray-800 ${
                  state.isLoading || !isProfileValid || isProfileSaving
                    ? "opacity-30 cursor-not-allowed"
                    : ""
                }`}
              >
                {isProfileSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t(onboardingKeys.bottom.savingText)}
                  </>
                ) : (
                  t(onboardingKeys.bottom.nextButton)
                )}
              </button>
            )}

            {state.currentPhase === "preferences" && (
              <button
                type="button"
                onClick={async () => {
                  await handlePreferencesNext();
                }}
                disabled={preferencesHook.step === 10 && !isPreferencesValid}
                className={`px-7 py-3 rounded-full font-medium transition-all cursor-pointer bg-black text-white hover:bg-black/90 ${
                  preferencesHook.step === 10 && !isPreferencesValid
                    ? "opacity-30 cursor-not-allowed"
                    : ""
                }`}
              >
                {preferencesHook.isLastStep
                  ? t(onboardingKeys.bottom.finishButton)
                  : t(onboardingKeys.bottom.nextButton)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
