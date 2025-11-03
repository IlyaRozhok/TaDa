"use client";

import React from "react";
import Image from "next/image";

interface OnboardingStepProps {
  stepData: {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    image: string;
  };
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  error: string;
  isLoading: boolean;
}

export default function OnboardingStep({
  stepData,
  currentStep,
  onBack,
  onNext,
  error,
  isLoading,
}: OnboardingStepProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl text-center">
          <div className="mb-8">
            <Image
              src={stepData.image}
              alt={stepData.title}
              width={400}
              height={300}
              className="mx-auto rounded-lg"
            />
          </div>
          <h2 className="text-3xl font-bold text-black mb-4">
            {stepData.title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {stepData.description}
          </p>
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
      {/* Progress Bar and Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600 mb-2">
              Step {currentStep - 1} of 3
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-black h-1 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Previous
            </button>
            <button
              onClick={onNext}
              disabled={isLoading}
              className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Setting up..." : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
