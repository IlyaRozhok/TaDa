"use client";

import React from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { onboardingKeys } from "../../lib/translationsKeys/onboardingTranslationKeys";

interface OnboardingIntroScreensProps {
  onComplete: () => void;
  currentStep?: number;
  totalSteps?: number;
}

const INTRO_STEPS = [
  {
    id: "discover",
    titleKey: onboardingKeys.step1.title,
    subtitleKey: onboardingKeys.step1.subtitle,
  },
  {
    id: "smart-matching",
    titleKey: onboardingKeys.step2.title,
    subtitleKey: onboardingKeys.step2.subtitle,
  },
  {
    id: "personalized",
    titleKey: onboardingKeys.step3.title,
    subtitleKey: onboardingKeys.step3.subtitle,
  },
];

export default function OnboardingIntroScreens({
  onComplete,
  currentStep: externalCurrentStep,
  totalSteps,
}: OnboardingIntroScreensProps) {
  const { t } = useTranslation();
  // Calculate internal step (0-2) from external step (1-3)
  const currentStep = externalCurrentStep ? externalCurrentStep - 1 : 0;

  const currentScreen = INTRO_STEPS[currentStep];
  if (!currentScreen) {
    return null;
  }
  const isLastStep = currentStep === INTRO_STEPS.length - 1;

  const title = t(currentScreen.titleKey);
  const description = t(currentScreen.subtitleKey);

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center">
      {/* Main Content */}
      <div className="flex flex-col items-center justify-center w-full max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-3 sm:mb-4 max-w-2xl">
          {title}
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-gray-600 max-w-md leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
