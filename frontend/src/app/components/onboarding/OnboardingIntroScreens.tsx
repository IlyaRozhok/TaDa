"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";

interface OnboardingIntroScreensProps {
  onComplete: () => void;
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
  {
    id: "ready",
    title: "Ready to dive in — or finish setting up first?",
    description:
      "Make the most of your search by completing your profile now. A complete profile means verified info, better matches, and more trust from landlords. Or, skip for now and explore — you can always come back later.",
    image: "/onboarding-last.png",
  },
];

export default function OnboardingIntroScreens({
  onComplete,
}: OnboardingIntroScreensProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < INTRO_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompletePreferences = () => {
    onComplete();
  };

  const handleBrowseWithoutProfile = () => {
    // Navigate to properties page
    if (typeof window !== "undefined") {
      window.location.href = "/app/units";
    }
  };

  const currentScreen = INTRO_STEPS[currentStep];
  const progress = ((currentStep + 1) / INTRO_STEPS.length) * 100;
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

        {/* Action Buttons for Last Step */}
        {isLastStep && (
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleCompletePreferences}
              className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Complete My Preferences
            </button>
            <button
              onClick={handleBrowseWithoutProfile}
              className="bg-white text-black border border-gray-300 px-8 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
            >
              Browse Without Profile
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1">
          <div
            className="bg-black h-1 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Previous Button */}
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`text-base font-medium transition-colors ${
                currentStep === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-black hover:text-gray-600"
              }`}
            >
              {currentStep > 0 && (
                <ChevronLeft className="inline-block w-4 h-4 mr-1" />
              )}
              Previous
            </button>

            {/* Step Indicator */}
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {INTRO_STEPS.length}
            </div>

            {/* Next Button - Hide on last step since we have action buttons */}
            {!isLastStep && (
              <button
                type="button"
                onClick={handleNext}
                className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            )}
            {isLastStep && <div></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
