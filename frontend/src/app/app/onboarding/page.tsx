"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../store/slices/authSlice";
import { preferencesAPI } from "../../lib/api";
import OnboardingProfileStep from "../../components/onboarding/OnboardingProfileStep";
import OnboardingIntroScreens from "../../components/onboarding/OnboardingIntroScreens";
import NewPreferencesPage from "../../components/preferences/NewPreferencesPage";
import TenantUniversalHeader from "../../components/TenantUniversalHeader";

type OnboardingStep = "intro" | "profile" | "preferences";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("intro");
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Check if user is authenticated and has preferences
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!isAuthenticated || !user) {
        router.push("/app/auth/login");
        return;
      }

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

  const handleProfileNext = async () => {
    // This will be called by OnboardingProfileStep's handleSubmit
    // The component will handle the submission and call onComplete
  };

  const handleIntroComplete = () => {
    setCurrentStep("profile");
  };

  const handleProfileComplete = async () => {
    setProfileLoading(true);
    // Small delay for smooth transition
    setTimeout(() => {
      setCurrentStep("preferences");
      setProfileLoading(false);
    }, 300);
  };

  const handlePreferencesComplete = () => {
    // Redirect to dashboard after preferences are saved
    router.push("/app/units");
  };

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

  // Show intro screens without header
  if (currentStep === "intro") {
    return <OnboardingIntroScreens onComplete={handleIntroComplete} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <TenantUniversalHeader
        searchTerm=""
        onSearchChange={() => {}}
        preferencesCount={0}
        showBackButton={false}
        showSearchInput={false}
        showPreferencesButton={false}
        showSaveButton={false}
        showTenantCvLink={false}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 pb-32 pt-10">
        {currentStep === "profile" ? (
          <OnboardingProfileStep
            onComplete={handleProfileComplete}
            isLoading={profileLoading}
            onNext={handleProfileNext}
          />
        ) : (
          <NewPreferencesPage onComplete={handlePreferencesComplete} />
        )}
      </div>

      {/* Bottom Navigation - Only for profile step */}
      {currentStep === "profile" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-1">
            <div
              className="bg-black h-1 transition-all duration-300"
              style={{ width: "50%" }}
            />
          </div>

          <div className="p-8">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="w-20"></div>

              <div className="text-sm text-gray-500">Step 2 of 3</div>

              <button
                type="button"
                onClick={handleProfileComplete}
                disabled={profileLoading}
                className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {profileLoading ? "Loading..." : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
