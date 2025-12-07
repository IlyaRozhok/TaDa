"use client";

import React, { useState } from "react";
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
    illustration: (
      <div className="w-full max-w-md mx-auto mb-8">
        {/* Isometric house illustration */}
        <div className="relative" style={{ paddingBottom: "75%" }}>
          <svg
            viewBox="0 0 400 300"
            className="absolute inset-0 w-full h-full"
            style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.1))" }}
          >
            {/* House base */}
            <polygon
              points="50,200 350,200 350,250 50,250"
              fill="#f3f4f6"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            {/* Lower level walls */}
            <polygon
              points="50,200 150,150 350,150 350,200"
              fill="#ffffff"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            {/* Upper level */}
            <polygon
              points="150,150 250,100 350,100 350,150"
              fill="#ffffff"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            {/* Roofs */}
            <polygon
              points="50,200 150,150 150,140 50,190"
              fill="#374151"
              stroke="#1f2937"
              strokeWidth="2"
            />
            <polygon
              points="150,150 250,100 250,90 150,140"
              fill="#374151"
              stroke="#1f2937"
              strokeWidth="2"
            />
            <polygon
              points="250,100 350,100 350,90 250,90"
              fill="#374151"
              stroke="#1f2937"
              strokeWidth="2"
            />
            {/* Windows with yellow light */}
            <rect x="70" y="160" width="30" height="30" fill="#fbbf24" />
            <rect x="110" y="160" width="30" height="30" fill="#fbbf24" />
            <rect x="180" y="110" width="30" height="30" fill="#fbbf24" />
            <rect x="220" y="110" width="30" height="30" fill="#fbbf24" />
            <rect x="260" y="110" width="30" height="30" fill="#fbbf24" />
            {/* Window frames */}
            <rect x="70" y="160" width="30" height="30" fill="none" stroke="#1f2937" strokeWidth="1.5" />
            <rect x="110" y="160" width="30" height="30" fill="none" stroke="#1f2937" strokeWidth="1.5" />
            <rect x="180" y="110" width="30" height="30" fill="none" stroke="#1f2937" strokeWidth="1.5" />
            <rect x="220" y="110" width="30" height="30" fill="none" stroke="#1f2937" strokeWidth="1.5" />
            <rect x="260" y="110" width="30" height="30" fill="none" stroke="#1f2937" strokeWidth="1.5" />
            {/* Interior details - bed */}
            <rect x="75" y="170" width="20" height="15" fill="#4b5563" />
            {/* Interior details - plant */}
            <circle cx="125" cy="180" r="5" fill="#10b981" />
          </svg>
        </div>
      </div>
    ),
  },
  {
    id: "smart-matching",
    title: "Smart matching",
    description:
      "Our advanced algorithm analyzes your preferences and matches you with properties that fit your lifestyle, budget and requirements.",
    illustration: (
      <div className="w-full max-w-md mx-auto mb-8">
        {/* Card stack illustration */}
        <div className="relative" style={{ height: "300px" }}>
          {/* Bottom card */}
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
            style={{
              width: "280px",
              height: "180px",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              transform: "translateX(-50%) rotate(-2deg)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div className="p-6 h-full flex flex-col justify-center items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-lg mb-3" />
              <div className="font-semibold text-black">Custom nail art</div>
              <div className="text-sm text-gray-500">Rp 80 total</div>
            </div>
          </div>
          {/* Middle card */}
          <div
            className="absolute bottom-8 left-1/2"
            style={{
              width: "280px",
              height: "180px",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              transform: "translateX(-50%) rotate(1deg)",
              border: "1px solid #e5e7eb",
              zIndex: 2,
            }}
          >
            <div className="p-6 h-full flex flex-col justify-center items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-300 to-orange-400 rounded-lg mb-3" />
              <div className="font-semibold text-black">Simple nail art</div>
              <div className="text-sm text-gray-500">Rp 60 total</div>
            </div>
          </div>
          {/* Top card */}
          <div
            className="absolute bottom-16 left-1/2"
            style={{
              width: "280px",
              height: "180px",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              transform: "translateX(-50%) rotate(-1deg)",
              border: "1px solid #e5e7eb",
              zIndex: 3,
            }}
          >
            <div className="p-6 h-full flex flex-col justify-center items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-300 to-green-400 rounded-lg mb-3" />
              <div className="font-semibold text-black">Manicure</div>
              <div className="text-sm text-gray-500">Rp 40 total</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "personalized",
    title: "Personalized Experience",
    description:
      "Save your favorites properties, track your search history and get personalized recommendations based on your activity.",
    illustration: (
      <div className="w-full max-w-md mx-auto mb-8">
        {/* Isometric apartment illustration */}
        <div className="relative" style={{ paddingBottom: "75%" }}>
          <svg
            viewBox="0 0 400 300"
            className="absolute inset-0 w-full h-full"
            style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.1))" }}
          >
            {/* Ground floor - Living area */}
            <polygon
              points="50,200 200,200 200,120 50,120"
              fill="#ffffff"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            {/* Ground floor - Bedroom */}
            <polygon
              points="200,200 350,200 350,120 200,120"
              fill="#ffffff"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            {/* Loft level */}
            <polygon
              points="200,120 350,120 350,60 200,60"
              fill="#ffffff"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            {/* Stairs */}
            <polygon
              points="180,200 200,200 200,120 180,120"
              fill="#d97706"
              stroke="#b45309"
              strokeWidth="1"
            />
            {/* Stair steps */}
            <line x1="180" y1="170" x2="200" y2="170" stroke="#b45309" strokeWidth="2" />
            <line x1="180" y1="150" x2="200" y2="150" stroke="#b45309" strokeWidth="2" />
            <line x1="180" y1="130" x2="200" y2="130" stroke="#b45309" strokeWidth="2" />
            {/* Furniture - Sofa */}
            <rect x="70" y="160" width="60" height="30" fill="#3b82f6" rx="4" />
            {/* Furniture - Table */}
            <rect x="80" y="135" width="40" height="20" fill="#fbbf24" rx="2" />
            {/* Furniture - Bed ground floor */}
            <rect x="230" y="160" width="50" height="30" fill="#6b7280" rx="4" />
            {/* Furniture - Bed loft */}
            <rect x="240" y="80" width="60" height="35" fill="#6b7280" rx="4" />
            {/* Window frames */}
            <rect x="270" y="70" width="60" height="40" fill="none" stroke="#1f2937" strokeWidth="2" />
            <line x1="300" y1="70" x2="300" y2="110" stroke="#1f2937" strokeWidth="2" />
            <line x1="270" y1="90" x2="330" y2="90" stroke="#1f2937" strokeWidth="2" />
            {/* Glass railing */}
            <rect x="200" y="110" width="150" height="5" fill="#93c5fd" opacity="0.6" />
          </svg>
        </div>
      </div>
    ),
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

  const currentScreen = INTRO_STEPS[currentStep];
  const progress = ((currentStep + 1) / INTRO_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        {/* Illustration */}
        <div className="mb-12">{currentScreen.illustration}</div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-black mb-4 text-center">
          {currentScreen.title}
        </h1>

        {/* Description */}
        <p className="text-base text-gray-600 max-w-md text-center leading-relaxed">
          {currentScreen.description}
        </p>
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
              {currentStep > 0 && <ChevronLeft className="inline-block w-4 h-4 mr-1" />}
              Previous
            </button>

            {/* Step Indicator */}
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {INTRO_STEPS.length}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              {currentStep < INTRO_STEPS.length - 1 ? "Next" : "Get Started"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

