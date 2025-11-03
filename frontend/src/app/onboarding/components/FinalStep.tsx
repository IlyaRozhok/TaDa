"use client";

import React from "react";
import Image from "next/image";

interface FinalStepProps {
  selectedRole: "tenant" | "operator" | null;
  onComplete: () => void;
  onCompleteWithPreferences: () => void;
  error: string;
  isLoading: boolean;
}

export default function FinalStep({
  selectedRole,
  onComplete,
  onCompleteWithPreferences,
  error,
  isLoading,
}: FinalStepProps) {
  const isTenant = selectedRole === "tenant";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl text-center">
          <div className="mb-8">
            <Image
              src="/onboarding-last.png"
              alt="Ready to dive in"
              width={400}
              height={300}
              className="mx-auto rounded-lg"
            />
          </div>
          <h2 className="text-3xl font-bold text-black mb-4">
            {isTenant
              ? "Ready to dive in — or finish setting up first?"
              : "Ready to start managing your properties?"}
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            {isTenant
              ? "Make the most of your search by completing your profile now. A complete profile means verified info, better matches, and more trust from landlords. Or, skip for now and explore — you can always come back later"
              : "Complete your business profile to attract more tenants and manage your properties efficiently. A complete profile builds trust and helps you connect with quality tenants. Or, start exploring the platform now — you can always complete your profile later"}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCompleteWithPreferences}
              disabled={isLoading}
              className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Setting up..."
                : isTenant
                ? "Complete My Preferences"
                : "Complete My Business Profile"}
            </button>
            <button
              onClick={onComplete}
              disabled={isLoading}
              className="bg-white text-black border-2 border-black px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Setting up..."
                : isTenant
                ? "Browse Without Profile"
                : "Start Exploring"}
            </button>
          </div>
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

