"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import UserDropdown from "../../components/UserDropdown";

// Onboarding Header Component
function OnboardingHeader() {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  // Close language dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".language-dropdown")) {
        setIsLanguageOpen(false);
      }
    };

    if (isLanguageOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isLanguageOpen]);

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-[95%] mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center">
          <button className="text-2xl font-bold text-black hover:text-gray-700 transition-colors cursor-pointer">
            :: TADA
          </button>
        </div>

        {/* Right: Language + Profile */}
        <div className="flex items-center space-x-4">
          {/* Language Dropdown - Glassmorphism Style */}
          <div className="relative language-dropdown">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-full transition-all duration-200 cursor-pointer backdrop-blur-md bg-black/20 border border-white/10 hover:bg-black/30 hover:border-white/20"
            >
              <span className="min-w-[1.5rem] text-center">
                {selectedLanguage}
              </span>
              <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
            </button>

            {isLanguageOpen && (
              <div className="absolute right-0 top-full mt-2 min-w-[180px] z-50 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                <div className="max-h-80 overflow-y-auto py-2">
                  {[
                    { code: "EN", name: "English" },
                    { code: "FR", name: "Français" },
                    { code: "ES", name: "Español" },
                    { code: "IT", name: "Italiano" },
                    { code: "PT", name: "Português" },
                    { code: "RU", name: "Русский" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setIsLanguageOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 ${
                        selectedLanguage === lang.code
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown - Simplified */}
          <UserDropdown simplified={true} />
        </div>
      </div>
    </nav>
  );
}

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
      {/* Header */}
      <OnboardingHeader />

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
