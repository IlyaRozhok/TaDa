"use client";

import React from "react";
import { useOnboarding } from "../hooks/useOnboarding";
import OnboardingStep from "./onboarding/OnboardingStep";
import RoleSelectionStep from "./onboarding/RoleSelectionStep";
import { Users, Target, Sparkles, Home, Heart } from "lucide-react";

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

interface OnboardingFlowProps {
  user: any;
  onComplete: () => void;
  isGoogleAuth?: boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Choose your role",
    subtitle: "Tell us who you are",
    description:
      "Select whether you're looking to rent a property or manage properties",
    image: "/choose-role-tenant.png",
    icon: <Users className="w-6 h-6" />,
  },
  {
    id: 2,
    title: "Smart matching",
    subtitle: "Find your perfect match",
    description:
      "Our advanced algorithm analyzes your preferences and matches you with properties that fit your lifestyle, budget and requirements",
    image: "/onboarding-step-2.png",
    icon: <Target className="w-6 h-6" />,
  },
  {
    id: 3,
    title: "Personalized Experience",
    subtitle: "Tailored just for you",
    description:
      "Save your favorites properties, track your search history and get personalized recommendations based on your activity",
    image: "/onboarding-step-3.png",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: 4,
    title: "Discover",
    subtitle: "Explore with confidence",
    description:
      "Discover your perfect home with your intelligent matching system. We help you find properties that match your lifestyle and preferences",
    image: "/house_home.png",
    icon: <Home className="w-6 h-6" />,
  },
  {
    id: 5,
    title: "Ready to dive in — or finish setting up first?",
    subtitle: "Your journey starts now",
    description:
      "Make the most of your search by completing your profile now. A complete profile means verified info, better matches, and more trust from landlords. Or, skip for now and explore — you can always come back later",
    image: "/onboarding-last.png",
    icon: <Heart className="w-6 h-6" />,
  },
];

export default function OnboardingFlow({
  user,
  onComplete,
  isGoogleAuth = false,
}: OnboardingFlowProps) {
  const {
    state,
    setCurrentStep,
    setSelectedRole,
    handleRoleSelection,
    handleComplete,
    handleSkip,
    clearError,
  } = useOnboarding(user, onComplete, isGoogleAuth);

  const totalSteps = onboardingSteps.length;

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <RoleSelectionStep
            selectedRole={state.selectedRole}
            onRoleSelect={handleRoleSelection}
            loading={state.isLoading}
          />
        );
      default:
        const stepData = onboardingSteps.find(
          (step) => step.id === state.currentStep
        );
        if (!stepData) return null;

        return (
          <OnboardingStep
            title={stepData.title}
            subtitle={stepData.subtitle}
            description={stepData.description}
            image={stepData.image}
            icon={stepData.icon}
            onNext={
              state.currentStep === totalSteps
                ? handleComplete
                : () => setCurrentStep(state.currentStep + 1)
            }
            onBack={
              state.currentStep > 1
                ? () => setCurrentStep(state.currentStep - 1)
                : undefined
            }
            onSkip={state.currentStep < totalSteps ? handleSkip : undefined}
            showBack={state.currentStep > 1}
            showSkip={state.currentStep < totalSteps}
            loading={state.isLoading}
            disabled={state.currentStep === 1 && !state.selectedRole}
            nextText={
              state.currentStep === totalSteps ? "Complete Setup" : "Next"
            }
            skipText="Skip onboarding"
          />
        );
    }
  };

  if (state.error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">{state.error}</p>
          </div>
          <button
            onClick={clearError}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">
              Step {state.currentStep} of {totalSteps}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-blue-600 h-1 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(state.currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="pt-20">{renderStepContent()}</div>
    </div>
  );
}
