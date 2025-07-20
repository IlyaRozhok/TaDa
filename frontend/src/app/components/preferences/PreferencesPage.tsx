"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { usePreferences } from "@/app/hooks/usePreferences";
import { StepNavigation } from "./ui";
import { LocationStep, BudgetStep, FeatureStep, PersonalStep } from "./steps";
import {
  BUILDING_STYLE_OPTIONS,
  LIFESTYLE_OPTIONS,
  SOCIAL_OPTIONS,
  WORK_OPTIONS,
  CONVENIENCE_OPTIONS,
  PET_OPTIONS,
  LUXURY_OPTIONS,
  TOTAL_STEPS,
} from "@/app/constants/preferences";
import { waitForSessionManager } from "@/app/components/providers/SessionManager";
import { getUserRole } from "@/app/components/DashboardRouter";

export default function PreferencesPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const {
    loading,
    step,
    success,
    generalError,
    watchedData,
    backendErrors,
    register,
    handleSubmit,
    updateField,
    toggleFeature,
    nextStep,
    prevStep,
    onSubmit,
    isLastStep,
    isFirstStep,
    user,
    isAuthenticated,
  } = usePreferences();

  // Wait for session manager to initialize and check access
  useEffect(() => {
    const initializeSession = async () => {
      try {
        await waitForSessionManager();
        setSessionReady(true);
      } catch (error) {
        console.error("Failed to initialize session:", error);
        setSessionReady(true); // Continue anyway
      }
    };
    initializeSession();
  }, []);

  // Check access permissions after user data is loaded
  useEffect(() => {
    if (sessionReady && isAuthenticated && user) {
      const userRole = getUserRole(user);

      console.log("PreferencesPage access check:", {
        userRole,
        hasTenantProfile: !!user.tenantProfile,
        user: user,
      });

      // Only allow access for tenants with tenantProfile
      if (userRole !== "tenant" || !user.tenantProfile) {
        console.log(
          "Access denied to preferences - not a tenant or no tenant profile"
        );
        setAccessDenied(true);

        // Redirect based on user role
        setTimeout(() => {
          if (userRole === "admin") {
            router.push("/app/dashboard/admin");
          } else if (userRole === "operator") {
            router.push("/app/dashboard/operator");
          } else {
            router.push("/app/dashboard");
          }
        }, 2000); // Show message for 2 seconds before redirect
      }
    }
  }, [sessionReady, isAuthenticated, user, router]);

  // Debug logging
  console.log("🔍 PreferencesPage render:", {
    sessionReady,
    isAuthenticated,
    user: !!user,
    loading,
    step,
    success,
    accessDenied,
  });

  // Show loading while session is initializing
  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Initializing session...</p>
        </div>
      </div>
    );
  }

  // Check authentication after session is ready
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check access permissions
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Access Restricted
          </h1>
          <p className="text-slate-600 mb-6">
            Preferences are only available for tenant accounts. You will be
            redirected to your dashboard.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Preferences Saved!
          </h2>
          <p className="text-slate-600 mb-8 text-lg leading-relaxed">
            Your preferences have been successfully updated. We'll use these to
            find your perfect home matches.
          </p>
          <div className="w-full bg-slate-100 rounded-lg p-4">
            <p className="text-slate-600 text-sm">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    const stepProps = {
      formData: watchedData,
      errors: backendErrors,
      onUpdate: updateField,
      onNext: nextStep,
      onPrevious: prevStep,
      isFirstStep,
      isLastStep,
      isLoading: loading,
    };

    switch (step) {
      case 1:
        return <LocationStep {...stepProps} />;

      case 2:
        return <BudgetStep {...stepProps} />;

      case 3:
        return (
          <FeatureStep
            {...stepProps}
            title="Building Style Preferences"
            description="Choose your preferred building types"
            icon={BUILDING_STYLE_OPTIONS[0].icon}
            color="purple"
            options={BUILDING_STYLE_OPTIONS}
            featureKey="building_style"
            onToggle={(feature) => toggleFeature("building_style", feature)}
          />
        );

      case 4:
        return (
          <FeatureStep
            {...stepProps}
            title="Lifestyle & Wellness"
            description="Select wellness and fitness amenities that matter to you"
            icon={LIFESTYLE_OPTIONS[0].icon}
            color="pink"
            options={LIFESTYLE_OPTIONS}
            featureKey="lifestyle_features"
            onToggle={(feature) => toggleFeature("lifestyle_features", feature)}
          />
        );

      case 5:
        return (
          <FeatureStep
            {...stepProps}
            title="Social & Community"
            description="Choose social spaces and community features you'd enjoy"
            icon={SOCIAL_OPTIONS[0].icon}
            color="orange"
            options={SOCIAL_OPTIONS}
            featureKey="social_features"
            onToggle={(feature) => toggleFeature("social_features", feature)}
          />
        );

      case 6:
        return (
          <FeatureStep
            {...stepProps}
            title="Work & Study"
            description="Select work and study facilities you need for productivity"
            icon={WORK_OPTIONS[0].icon}
            color="blue"
            options={WORK_OPTIONS}
            featureKey="work_features"
            onToggle={(feature) => toggleFeature("work_features", feature)}
          />
        );

      case 7:
        return (
          <FeatureStep
            {...stepProps}
            title="Convenience"
            description="Choose convenience features that make daily life easier"
            icon={CONVENIENCE_OPTIONS[0].icon}
            color="green"
            options={CONVENIENCE_OPTIONS}
            featureKey="convenience_features"
            onToggle={(feature) =>
              toggleFeature("convenience_features", feature)
            }
          />
        );

      case 8:
        return (
          <FeatureStep
            {...stepProps}
            title="Pet-Friendly"
            description="Select pet-friendly amenities if you have or plan to get pets"
            icon={PET_OPTIONS[0].icon}
            color="purple"
            options={PET_OPTIONS}
            featureKey="pet_friendly_features"
            onToggle={(feature) =>
              toggleFeature("pet_friendly_features", feature)
            }
          />
        );

      case 9:
        return (
          <FeatureStep
            {...stepProps}
            title="Luxury & Premium"
            description="Choose luxury amenities and premium services you value"
            icon={LUXURY_OPTIONS[0].icon}
            color="yellow"
            options={LUXURY_OPTIONS}
            featureKey="luxury_features"
            onToggle={(feature) => toggleFeature("luxury_features", feature)}
          />
        );

      case 10:
        return <PersonalStep {...stepProps} />;

      case 11:
        return <ReviewStep formData={watchedData} />;

      default:
        return <LocationStep {...stepProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app/dashboard/tenant"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-6 font-medium group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Dashboard
          </Link>

          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Set Preferences
            </h1>
            <p className="text-slate-600">
              Help us find your perfect home by sharing your preferences
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {generalError && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-1">
                  Error Saving Preferences
                </h3>
                <p className="text-red-700">{generalError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={(e) => {
            console.log("🔍 Form onSubmit triggered!", {
              step,
              totalSteps: TOTAL_STEPS,
              isLastStep,
              loading,
            });
            // Call the actual submit handler
            handleSubmit(onSubmit)(e);
          }}
          className="space-y-8"
        >
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8">
            <StepNavigation
              currentStep={step}
              totalSteps={TOTAL_STEPS}
              onNext={nextStep}
              onPrevious={prevStep}
              isLastStep={isLastStep}
              isLoading={loading}
            />
          </div>
          {renderStep()}
        </form>
      </div>
    </div>
  );
}

// Simple ReviewStep component for step 11
const ReviewStep: React.FC<{ formData: any }> = ({ formData }) => {
  console.log("🔍 ReviewStep rendered - Final step reached!", { formData });

  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
      <div className="flex items-center justify-center mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">Review & Confirm</h2>
          <p className="text-slate-600 text-sm">
            Review your preferences before saving
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 text-center">
        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Ready to Save Your Preferences?
        </h3>
        <p className="text-slate-600 text-sm">
          Once saved, we'll use these preferences to find your perfect property
          matches. You can always update them later from your profile.
        </p>

        {/* Debug info */}
        <div className="mt-4 text-xs text-slate-500">
          <p>Step 11 of 11 - Form ready for submission</p>
          <p>Click "Save Preferences" button above to submit</p>
        </div>
      </div>
    </section>
  );
};
