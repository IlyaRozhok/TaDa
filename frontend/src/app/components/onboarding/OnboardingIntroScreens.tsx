"use client";

import React from "react";


interface OnboardingIntroScreensProps {
  onComplete: () => void;
  currentStep?: number;
  totalSteps?: number;
}

const INTRO_STEPS = [
  {
    id: "discover",
    title: "Discover",
    description:
      "Discover your perfect home with your intelligent matching system. We help you find properties that match your lifestyle and preferences.",
  },
  {
    id: "smart-matching",
    title: "Smart matching",
    description:
      "Our advanced algorithm analyzes your preferences and matches you with properties that fit your lifestyle, budget and requirements.",
  },
  {
    id: "personalized",
    title: "Personalized Experience",
    description:
      "Save your favorites properties, track your search history and get personalized recommendations based on your activity.",
  },
];

export default function OnboardingIntroScreens({
  onComplete,
  currentStep: externalCurrentStep,
  totalSteps,
}: OnboardingIntroScreensProps) {
  // Calculate internal step (0-2) from external step (1-3)
  const currentStep = externalCurrentStep ? externalCurrentStep - 1 : 0;


  const currentScreen = INTRO_STEPS[currentStep];
  const isLastStep = currentStep === INTRO_STEPS.length - 1;

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center">
      {/* Main Content */}
      <div className="flex flex-col items-center justify-center w-full max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-3 sm:mb-4 max-w-2xl">
          {currentScreen.title}
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-gray-600 max-w-md leading-relaxed">
          {currentScreen.description}
        </p>

      </div>

    </div>
  );
}
