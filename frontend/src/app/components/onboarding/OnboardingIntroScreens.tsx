"use client";

import React from "react";
import Image from "next/image";


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
    image: "/onboarding-first.png",
  },
  {
    id: "smart-matching",
    title: "Smart matching",
    description:
      "Our advanced algorithm analyzes your preferences and matches you with properties that fit your lifestyle, budget and requirements.",
    image: "/onboarding-step-2.png",
  },
  {
    id: "personalized",
    title: "Personalized Experience",
    description:
      "Save your favorites properties, track your search history and get personalized recommendations based on your activity.",
    image: "/onboarding-step-3.png",
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        {/* Illustration/Image */}
        <div className="mb-12 w-full max-w-md mx-auto">
          <div className="relative w-full" style={{ paddingBottom: "75%" }}>
            <Image
              src={currentScreen.image}
              alt={currentScreen.title}
              fill
              className="object-contain"
              priority={currentStep === 0}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-black mb-4 text-center max-w-2xl">
          {currentScreen.title}
        </h1>

        {/* Description */}
        <p className="text-base text-gray-600 max-w-md text-center leading-relaxed mb-8">
          {currentScreen.description}
        </p>

      </div>

    </div>
  );
}
