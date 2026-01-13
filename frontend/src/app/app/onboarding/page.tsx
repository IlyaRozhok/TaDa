"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ChevronDown, ChevronLeft } from "lucide-react";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";
import { preferencesAPI } from "../../lib/api";
import OnboardingProfileStep from "../../components/onboarding/OnboardingProfileStep";
import OnboardingIntroScreens from "../../components/onboarding/OnboardingIntroScreens";
import NewPreferencesPage from "../../components/preferences/NewPreferencesPage";
import UserDropdown from "../../components/UserDropdown";
import {
  useOnboarding,
  TOTAL_ONBOARDING_STEPS,
  PROFILE_STEP,
  PREFERENCES_START_STEP,
} from "../../hooks/useOnboarding";
import { usePreferences } from "../../hooks/usePreferences";

// Onboarding Header Component
function OnboardingHeader() {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".language-dropdown")) {
        setIsLanguageOpen(false);
      }
    };

    if (isLanguageOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isLanguageOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-1 sm:px-1.5 lg:px-2 py-0.75 sm:py-1">
      <div className="max-w-[98%] sm:max-w-[95%] mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center">
          <button className="text-lg sm:text-xl lg:text-2xl font-bold text-black hover:text-gray-700 transition-colors cursor-pointer">
            :: TADA
          </button>
        </div>

        {/* Right: Language + Profile */}
        <div className="flex items-center space-x-0.75 sm:space-x-1">
          {/* Language Dropdown */}
          <div className="relative language-dropdown">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-0.25 px-0.75 py-0.375 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <span>{selectedLanguage}</span>
              <ChevronDown className="w-0.75 h-0.75" />
            </button>

            {isLanguageOpen && (
              <div
                className="absolute right-0 top-full mt-1 sm:mt-2 rounded-xl min-w-[100px] sm:min-w-[120px] z-50 overflow-hidden backdrop-blur-[3px]"
                style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 1.5625rem 3.125rem rgba(0, 0, 0, 0.4), 0 0.625rem 1.875rem rgba(0, 0, 0, 0.2), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.1), inset 0 -0.0625rem 0 rgba(0, 0, 0, 0.2)',
                }}
              >
                <div className="max-h-40 overflow-y-auto rounded-xl relative">
                  {[
                    { code: "EN", name: "English" },
                    { code: "FR", name: "Français" },
                    { code: "ES", name: "Español" },
                    { code: "IT", name: "Italiano" },
                    { code: "PT", name: "Português" },
                    { code: "RU", name: "Русский" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setIsLanguageOpen(false);
                      }}
                      className={`block w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 rounded-lg ${
                        selectedLanguage === lang.code
                          ? "bg-white/18 text-white font-semibold"
                          : "text-white hover:bg-white/12"
                      }`}
                      style={{
                        backdropFilter: selectedLanguage === lang.code ? 'blur(10px)' : undefined,
                        fontWeight: selectedLanguage === lang.code ? 600 : undefined,
                      }}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown - Simplified */}
          <UserDropdown simplified={true} />
        </div>
      </div>
    </nav>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [loading, setLoading] = useState(true);
  const [isProfileValid, setIsProfileValid] = useState(false);
  const [isPreferencesValid, setIsPreferencesValid] = useState(true);

  const {
    state,
    setCurrentStep,
    handleIntroComplete,
    handleProfileComplete,
    handlePreferencesComplete,
  } = useOnboarding(user, () => router.push("/app/units"));

  // Handle profile completion with save
  const handleProfileNext = async () => {
    if (!isProfileValid) {
      return;
    }

    // Call the save function from the profile component
    if ((window as any).onboardingProfileSave) {
      const success = await (window as any).onboardingProfileSave();
      if (success) {
        handleProfileComplete();
      }
    } else {
      handleProfileComplete();
    }
  };

  // Only use preferences hook in preferences phase to avoid conflicts
  const preferencesHook = usePreferences(PREFERENCES_START_STEP - 1);

  // Sync onboarding step with preferences step
  useEffect(() => {
    if (state.currentPhase === "preferences") {
      const onboardingStep = PREFERENCES_START_STEP - 1 + preferencesHook.step;
      if (onboardingStep >= PREFERENCES_START_STEP && onboardingStep <= TOTAL_ONBOARDING_STEPS) {
        // Only update if different to avoid unnecessary re-renders
        if (onboardingStep !== state.currentStep) {
          setCurrentStep(onboardingStep);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesHook.step, state.currentPhase]);

  const handlePreferencesNext = async () => {
    if (preferencesHook.isLastStep) {
      await handlePreferencesComplete();
    } else {
      await preferencesHook.nextStep();
    }
  };

  const handlePreferencesPrevious = async () => {
    if (!preferencesHook.isFirstStep) {
      await preferencesHook.prevStep();
    }
  };

  // Check if user is authenticated and has preferences
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!isAuthenticated || !user) {
        router.push("/app/auth/login");
        return;
      }

      // Reset preferences step for new onboarding
      localStorage.removeItem("preferencesStep");

      // Check if user already has preferences
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/app/auth/login");
          return;
        }

        const response = await preferencesAPI.get();
        if (response.data && response.data.id) {
          // User has preferences, redirect to dashboard
          router.push("/app/units");
          return;
        }
      } catch (error: unknown) {
        // 404 means no preferences - user needs onboarding
        const errorResponse = error as { response?: { status?: number } };
        if (errorResponse.response?.status !== 404) {
          console.error("Error checking preferences:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [isAuthenticated, user, router]);

  if (loading) {
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
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        {/* Onboarding Header */}
        <OnboardingHeader />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="h-full max-w-4xl mx-auto px-1 sm:px-1.5 lg:px-2 pt-12 sm:pt-14 lg:pt-16 pb-4 sm:pb-6 lg:pb-8 flex items-center justify-center">
            <OnboardingIntroScreens
              onComplete={handleIntroComplete}
              currentStep={state.currentStep}
              totalSteps={TOTAL_ONBOARDING_STEPS}
            />
          </div>
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
                Previous
              </button>

              <div className="text-sm text-gray-500">
                Step {state.currentStep} of {TOTAL_ONBOARDING_STEPS}
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
                className="bg-black cursor-pointer text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Onboarding Header */}
      <OnboardingHeader />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 lg:pt-16 pb-24 sm:pb-28 lg:pb-32 flex items-start lg:items-center">
          <div className="w-full">
            {state.currentPhase === "profile" ? (
              <OnboardingProfileStep
                onComplete={handleProfileComplete}
                isLoading={state.isLoading}
                onNext={handleProfileNext}
                currentStep={state.currentStep}
                totalSteps={TOTAL_ONBOARDING_STEPS}
                onValidationChange={setIsProfileValid}
              />
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
        </div>
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
                }
              }}
              className="text-base font-medium transition-colors text-black hover:text-gray-600 cursor-pointer"
            >
              Previous
            </button>

            <div className="text-sm text-gray-500">
              Step {state.currentStep} of {TOTAL_ONBOARDING_STEPS}
            </div>

            {/* Next Button */}
            {state.currentPhase === "profile" && (
              <button
                type="button"
                onClick={handleProfileNext}
                disabled={state.isLoading || !isProfileValid}
                className={`px-8 py-3 rounded-full font-medium transition-colors cursor-pointer ${
                  state.isLoading || !isProfileValid
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {state.isLoading ? "Loading..." : "Next"}
              </button>
            )}

            {state.currentPhase === "preferences" && (
              <button
                type="button"
                onClick={handlePreferencesNext}
                disabled={preferencesHook.step === 10 && !isPreferencesValid}
                className={`px-8 py-3 rounded-full font-medium transition-colors cursor-pointer ${
                  preferencesHook.step === 10 && !isPreferencesValid
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {preferencesHook.isLastStep ? "Finish" : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
