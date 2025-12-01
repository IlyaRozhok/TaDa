"use client";

import React, { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import TenantUniversalHeader from "../TenantUniversalHeader";
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

export default function NewPreferencesPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    loading,
    step,
    watchedData,
    updateField,
    toggleFeature,
    nextStep,
    prevStep,
    savePreferences,
    isLastStep,
    isFirstStep,
    user,
    isAuthenticated,
  } = usePreferences();

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

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
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

  const handleSave = async () => {
    try {
      await savePreferences();
      console.log("✅ Preferences saved successfully");
    } catch (error) {
      console.error("❌ Failed to save preferences:", error);
      toast.error("Failed to save preferences");
    }
  };

  const handleGoBack = () => {
    const path = getRedirectPath(user);
    router.replace(path);
  };

  const handleFinish = async () => {
    try {
      await savePreferences();
      console.log("✅ Preferences saved successfully");
      // toast.success("Preferences saved successfully!");
      // Optionally redirect to dashboard after successful save
      // router.push("/app/dashboard");
    } catch (error) {
      console.error("❌ Failed to save preferences:", error);
      toast.error("Failed to save preferences");
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData: watchedData,
      onUpdate: updateField,
      onToggle: toggleFeature,
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
        return (
          <MultiSelectStep
            title="Lifestyle & Wellness"
            description="Select wellness and fitness amenities that matter to you"
            stepTitle="Lifestyle & Wellness"
            options={LIFESTYLE_OPTIONS}
            category="lifestyle_features"
            {...stepProps}
          />
        );
      case 8:
        return (
          <MultiSelectStep
            title="Social & Community"
            description="Choose social spaces and community features you'd enjoy"
            stepTitle="Social & Community"
            options={SOCIAL_OPTIONS}
            category="social_features"
            {...stepProps}
          />
        );
      case 9:
        return (
          <MultiSelectStep
            title="Work & Study"
            description="Select work and study facilities you need for productivity"
            stepTitle="Work & Study"
            options={WORK_STUDY_OPTIONS}
            category="work_features"
            {...stepProps}
          />
        );
      case 10:
        return (
          <MultiSelectStep
            title="Convenience"
            description="Choose convenience features that make daily life easier"
            stepTitle="Convenience"
            options={CONVENIENCE_FEATURES_OPTIONS}
            category="convenience_features"
            {...stepProps}
          />
        );
      case 11:
        return (
          <MultiSelectStep
            title="Pet-Friendly"
            description="Select pet-friendly amenities if you have or plan to get pets"
            stepTitle="Pet-Friendly"
            options={PET_FRIENDLY_OPTIONS}
            category="pet_friendly_features"
            {...stepProps}
          />
        );
      case 12:
        return (
          <MultiSelectStep
            title="Luxury & Premium"
            description="Choose luxury amenities and premium services you value"
            stepTitle="Luxury & Premium"
            options={LUXURY_PREMIUM_OPTIONS}
            category="luxury_features"
            {...stepProps}
          />
        );
      case 13:
        return (
          <MultiSelectStep
            title="Ideal Living Environment"
            description="The type of household atmosphere you prefer (select multiple)"
            stepTitle="Ideal Living Environment"
            options={IDEAL_LIVING_OPTIONS}
            category="ideal_living_environment"
            {...stepProps}
          />
        );
      case 14:
        return (
          <MultiSelectStep
            title="Smoking"
            description="Important for matching with smoke-friendly accommodations"
            stepTitle="Do you smoke?"
            options={SMOKING_OPTIONS}
            category="smoker"
            {...stepProps}
          />
        );
      case 15:
        return <PersonalPreferencesStep {...stepProps} />;
      case 16:
        return <AboutYouStep {...stepProps} />;
      default:
        return <LocationStep {...stepProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <TenantUniversalHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        preferencesCount={0}
        showBackButton={false}
        showSearchInput={false}
        showPreferencesButton={false}
        showSaveButton={true}
        onSaveClick={handleSave}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 pb-32 pt-10">
        <form onSubmit={(e) => e.preventDefault()}>{renderStep()}</form>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1">
          <div
            className="bg-black h-1 transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={isFirstStep}
              className={`font-medium ${
                isFirstStep
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-black hover:text-gray-600"
              } transition-colors`}
            >
              Back
            </button>

            <div className="text-sm text-gray-500">
              Step {step} of {TOTAL_STEPS}
            </div>

            <button
              type="button"
              onClick={isLastStep ? handleFinish : nextStep}
              disabled={loading}
              className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
