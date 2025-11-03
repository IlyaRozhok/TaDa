"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { useOnboarding, ONBOARDING_STEPS } from "../hooks/useOnboarding";
import { RoleSelection, OnboardingStep, FinalStep } from "../components";

function OnboardingStepContent() {
  const params = useParams();
  const currentStep = Number(params.step) || 1;

  const {
    selectedRole,
    isLoading,
    error,
    userData,
    handleRoleSelect,
    handleComplete,
    handleCompleteWithPreferences,
    handleBack,
    handleNext,
    handleContinue,
  } = useOnboarding(currentStep);
  // Step 1: Role selection
  if (currentStep === 1) {
    return (
      <RoleSelection
        selectedRole={selectedRole}
        onRoleSelect={handleRoleSelect}
        onContinue={handleContinue}
        error={error}
        isLoading={isLoading}
      />
    );
  }

  // Steps 2-5: Show step content
  const steps = selectedRole ? ONBOARDING_STEPS[selectedRole] : [];
  const stepData = steps.find((s) => s.id === currentStep);

  // Fallback for missing step data
  if (!stepData && currentStep !== 5) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Step not found.</p>
      </div>
    );
  }

  // Step 5: Final step (special actions)
  if (currentStep === 5) {
    console.log("🔍 Step 5 - userData:", {
      email: userData.email,
      password: userData.password ? "***" : "empty",
      hasEmail: !!userData.email,
      hasPassword: !!userData.password,
    });

    return (
      <FinalStep
        selectedRole={selectedRole}
        onComplete={handleComplete}
        onCompleteWithPreferences={handleCompleteWithPreferences}
        error={error}
        isLoading={isLoading}
      />
    );
  }

  // Steps 2-4: Show step content and navigation
  return (
    <OnboardingStep
      stepData={stepData!}
      currentStep={currentStep}
      onBack={handleBack}
      onNext={handleNext}
      error={error}
      isLoading={isLoading}
    />
  );
}

export default function OnboardingStepPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading onboarding...</p>
          </div>
        </div>
      }
    >
      <OnboardingStepContent />
    </Suspense>
  );
}
