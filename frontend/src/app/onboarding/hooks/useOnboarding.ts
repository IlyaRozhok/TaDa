"use client";

import { useOnboardingContext } from "../../contexts/OnboardingContext";

export const ONBOARDING_STEPS = {
  tenant: [
    {
      id: 2,
      title: "Discover",
      subtitle: "Explore with confidence",
      description:
        "Discover your perfect home with your intelligent matching system. We help you find properties that match your lifestyle and preferences",
      image: "/house_home.png",
    },
    {
      id: 3,
      title: "Smart matching",
      subtitle: "Find your perfect match",
      description:
        "Our advanced algorithm analyzes your preferences and matches you with properties that fit your lifestyle, budget and requirements",
      image: "/onboarding-step-2.png",
    },
    {
      id: 4,
      title: "Personalized Experience",
      subtitle: "Tailored just for you",
      description:
        "Save your favorites properties, track your search history and get personalized recommendations based on your activity",
      image: "/onboarding-step-3.png",
    },
    {
      id: 5,
      title: "Ready to dive in — or finish setting up first?",
      subtitle: "Your journey starts now",
      description:
        "Make the most of your search by completing your profile now. A complete profile means verified info, better matches, and more trust from landlords. Or, skip for now and explore — you can always come back later",
      image: "/onboarding-last.png",
    },
  ],
  operator: [
    {
      id: 2,
      title: "Discover",
      subtitle: "Explore with confidence",
      description:
        "Discover your perfect home with your intelligent matching system. We help you find properties that match your lifestyle and preferences",
      image: "/house_home.png",
    },
    {
      id: 3,
      title: "Smart matching",
      subtitle: "Find your perfect match",
      description:
        "Our advanced algorithm analyzes your preferences and matches you with properties that fit your lifestyle, budget and requirements",
      image: "/onboarding-step-2.png",
    },
    {
      id: 4,
      title: "Personalized Experience",
      subtitle: "Tailored just for you",
      description:
        "Save your favorites properties, track your search history and get personalized recommendations based on your activity",
      image: "/onboarding-step-3.png",
    },
    {
      id: 5,
      title: "Ready to start managing your properties?",
      subtitle: "Your business journey begins",
      description:
        "Complete your business profile to attract more tenants and manage your properties efficiently. A complete profile builds trust and helps you connect with quality tenants. Or, start exploring the platform now — you can always complete your profile later",
      image: "/onboarding-last.png",
    },
  ],
};

export function useOnboarding(currentStep: number) {
  const context = useOnboardingContext();

  return {
    selectedRole: context.selectedRole,
    isLoading: context.isLoading,
    error: context.error,
    userData: context.userData,
    handleRoleSelect: context.handleRoleSelect,
    handleComplete: context.handleComplete,
    handleCompleteWithPreferences: context.handleCompleteWithPreferences,
    handleBack: () => context.handleBack(currentStep),
    handleNext: () => context.handleNext(currentStep),
    handleContinue: context.handleContinue,
    setError: context.setError,
  };
}
