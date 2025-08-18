"use client";

import React, { useEffect, useState } from "react";
import { Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { DateRangePicker } from "./ui/DateRangePicker";
import { CustomDropdown } from "./ui/CustomDropdown";
import { MetroDropdown } from "./ui/MetroDropdown";
import { LocationDropdown } from "./ui/LocationDropdown";
import { BedroomsDropdown, FurnishingDropdown } from "./ui";

import { usePreferences } from "@/app/hooks/usePreferences";
import {
  BUILDING_STYLE_OPTIONS,
  LIFESTYLE_OPTIONS,
  SOCIAL_OPTIONS,
  WORK_STUDY_OPTIONS,
  CONVENIENCE_FEATURES_OPTIONS,
  PET_FRIENDLY_OPTIONS,
  LUXURY_PREMIUM_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  SECONDARY_LOCATION_OPTIONS,
  COMMUTE_LOCATION_OPTIONS,
  IDEAL_LIVING_OPTIONS,
  SMOKING_OPTIONS,
  HOBBY_ICON_OPTIONS,
  TOTAL_STEPS_NEW as TOTAL_STEPS,
} from "@/app/constants/preferences";
import { waitForSessionManager } from "@/app/components/providers/SessionManager";

export default function NewPreferencesPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);

  const {
    loading,
    step,
    watchedData,
    updateField,
    toggleFeature,
    nextStep,
    prevStep,
    savePreferences,
    isLastStep,
    isFirstStep,
    user,
    isAuthenticated,
  } = usePreferences();

  // Wait for session manager to initialize
  useEffect(() => {
    const initializeSession = async () => {
      try {
        await waitForSessionManager();
        setSessionReady(true);
      } catch (error) {
        console.error("Failed to initialize session:", error);
        setSessionReady(true);
      }
    };
    initializeSession();
  }, []);

  // Always allow access to preferences for any authenticated user (no redirects)
  useEffect(() => {
    if (hasCheckedAccess) return;
    if (sessionReady && isAuthenticated && user) {
      setHasCheckedAccess(true);
      setAccessDenied(false);
    }
  }, [sessionReady, isAuthenticated, user, hasCheckedAccess]);

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    // Should never happen now, but keep graceful fallback
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-4">
            Access Restricted
          </h1>
          <p className="text-gray-600 mb-6">
            Preferences are only available for tenant accounts.
          </p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await savePreferences();
      console.log("✅ Preferences saved successfully");
    } catch (error) {
      console.error("❌ Failed to save preferences:", error);
      toast.error("Failed to save preferences");
    }
  };

  const handleGoBack = () => {
    router.push("/app/dashboard");
  };

  const handleFinish = async () => {
    try {
      await savePreferences();
      console.log("✅ Preferences saved successfully");
      // toast.success("Preferences saved successfully!");
      // Optionally redirect to dashboard after successful save
      // router.push("/app/dashboard");
    } catch (error) {
      console.error("❌ Failed to save preferences:", error);
      toast.error("Failed to save preferences");
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData: watchedData,
      onUpdate: updateField,
      onToggle: toggleFeature,
    };

    switch (step) {
      case 1:
        return <LocationStep {...stepProps} />;
      case 2:
        return <CommuteTimeStep {...stepProps} />;
      case 3:
        return <BudgetStep {...stepProps} />;
      case 4:
        return <PropertyTypeStep {...stepProps} />;
      case 5:
        return <ApartmentSpecStep {...stepProps} />;
      case 6:
        return <BuildingStyleStep {...stepProps} />;
      case 7:
        return <LifestyleWellnessStep {...stepProps} />;
      case 8:
        return <SocialCommunityStep {...stepProps} />;
      case 9:
        return <WorkStudyStep {...stepProps} />;
      case 10:
        return <ConvenienceStep {...stepProps} />;
      case 11:
        return <PetFriendlyStep {...stepProps} />;
      case 12:
        return <LuxuryPremiumStep {...stepProps} />;
      case 13:
        return <IdealLivingStep {...stepProps} />;
      case 14:
        return <SmokingStep {...stepProps} />;
      case 15:
        return <PersonalPreferencesStep {...stepProps} />;
      case 16:
        return <AboutYouStep {...stepProps} />;
      default:
        return <LocationStep {...stepProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 px-8">
        <div className="flex items-center">
          <button
            onClick={handleGoBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div className="w-8 h-8 bg-slate-600 rounded-full mr-3"></div>
          <span className="text-xl text-black font-semibold">tada.co</span>
        </div>
        <button
          onClick={handleSave}
          className="cursor-pointer text-gray-600 border-1 rounded-2xl p-2 hover:text-black transition-colors font-medium"
        >
          Save
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 pb-32">
        <form onSubmit={(e) => e.preventDefault()}>{renderStep()}</form>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1">
          <div
            className="bg-black h-1 transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={isFirstStep}
              className={`font-medium ${
                isFirstStep
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-black hover:text-gray-600"
              } transition-colors`}
            >
              Back
            </button>

            <div className="text-sm text-gray-500">
              Step {step} of {TOTAL_STEPS}
            </div>

            <button
              type="button"
              onClick={isLastStep ? handleFinish : nextStep}
              disabled={loading}
              className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
const LocationStep = ({ formData, onUpdate }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Location and Commute</h1>
    <p className="text-gray-500 mb-6">
      Where do you want to live and where will you commute to?
    </p>

    <div className="text-left">
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-black mb-8 text-left">
          Location and date
        </h2>

        <div className="space-y-6">
          <CustomDropdown
            label="Primary postcode"
            value={formData.primary_postcode || ""}
            onChange={(value) => onUpdate("primary_postcode", value)}
            options={[
              {
                value: "NW1 6XE",
                label: "NW1 6XE",
                postcode: "NW1 6XE",
                address: "221B Baker Street, Marylebone",
              },
              {
                value: "SW1A 2AA",
                label: "SW1A 2AA",
                postcode: "SW1A 2AA",
                address: "10 Downing Street, Westminster",
              },
              {
                value: "NW1 0JH",
                label: "NW1 0JH",
                postcode: "NW1 0JH",
                address: "30 Camden High Street, Camden Town",
              },
              {
                value: "E1 6RF",
                label: "E1 6RF",
                postcode: "E1 6RF",
                address: "12 Brick Lane, Shoreditch",
              },
              {
                value: "W11 3JZ",
                label: "W11 3JZ",
                postcode: "W11 3JZ",
                address: "89 Notting Hill Gate, Notting Hill",
              },
              {
                value: "E2 8AA",
                label: "E2 8AA",
                postcode: "E2 8AA",
                address: "25 Kingsland Road, Dalston",
              },
              {
                value: "SE1 1UN",
                label: "SE1 1UN",
                postcode: "SE1 1UN",
                address: "50 Southwark Street, South Bank",
              },
            ]}
          />

          <LocationDropdown
            label="Commute location"
            value={formData.commute_location || "no-preference"}
            options={COMMUTE_LOCATION_OPTIONS}
            onChange={(value) => onUpdate("commute_location", value)}
            placeholder="No Preference"
          />

          <MetroDropdown
            label="Secondary location (optional)"
            value={formData.secondary_location || "no-preference"}
            options={SECONDARY_LOCATION_OPTIONS}
            onChange={(value) => onUpdate("secondary_location", value)}
            placeholder="No Preference"
          />

          <DateRangePicker
            label="Move-in Date"
            value={{
              start: formData.move_in_date || null,
              end: formData.move_out_date || null,
            }}
            onChange={(range) => {
              onUpdate("move_in_date", range.start);
              // Only set move_out_date if it's different from move_in_date (range selection)
              onUpdate(
                "move_out_date",
                range.start === range.end ? null : range.end
              );
            }}
            placeholder="Select date range"
          />
        </div>
      </div>
    </div>
  </div>
);

const CommuteTimeStep = ({ formData, onUpdate }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Maximum Commute Time</h1>
    <p className="text-gray-500 mb-6">
      How long are you willing to commute using different transport methods?
    </p>

    <div className="text-left">
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-black mb-8 text-left">
          Commute preferences
        </h2>

        <div className="space-y-6">
          <div className="relative">
            <input
              type="number"
              min="1"
              max="120"
              value={formData.commute_time_walk || ""}
              onChange={(e) =>
                onUpdate(
                  "commute_time_walk",
                  Number(e.target.value) || undefined
                )
              }
              className="w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-transparent border-0 shadow-sm"
              placeholder=""
            />
            <label
              className={`absolute left-6 transition-all duration-200 pointer-events-none ${
                formData.commute_time_walk
                  ? "top-3 text-xs text-gray-500"
                  : "top-1/2 translate-y-1 text-base text-gray-400"
              }`}
            >
              Walking (minutes)
            </label>
          </div>

          <div className="relative">
            <input
              type="number"
              min="1"
              max="120"
              value={formData.commute_time_cycle || ""}
              onChange={(e) =>
                onUpdate(
                  "commute_time_cycle",
                  Number(e.target.value) || undefined
                )
              }
              className="w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-transparent border-0 shadow-sm"
              placeholder=""
            />
            <label
              className={`absolute left-6 transition-all duration-200 pointer-events-none ${
                formData.commute_time_cycle
                  ? "top-3 text-xs text-gray-500"
                  : "top-1/2 translate-y-1 text-base text-gray-400"
              }`}
            >
              Cycling (minutes)
            </label>
          </div>

          <div className="relative">
            <input
              type="number"
              min="1"
              max="120"
              value={formData.commute_time_tube || ""}
              onChange={(e) =>
                onUpdate(
                  "commute_time_tube",
                  Number(e.target.value) || undefined
                )
              }
              className="w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-transparent border-0 shadow-sm"
              placeholder=""
            />
            <label
              className={`absolute left-6 transition-all duration-200 pointer-events-none ${
                formData.commute_time_tube
                  ? "top-3 text-xs text-gray-500"
                  : "top-1/2 translate-y-1 text-base text-gray-400"
              }`}
            >
              Tube/Public Transport (minutes)
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BudgetStep = ({ formData, onUpdate }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Your Budget</h1>
    <p className="text-gray-500 mb-6">
      Select how you'll be using platform. For now one account - one role
    </p>

    <div className="space-y-8 text-left">
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-black mb-8 text-left">
          Budget range
        </h2>

        <div className="space-y-6">
          <div className="relative">
            <input
              type="number"
              value={formData.min_price || ""}
              onChange={(e) => onUpdate("min_price", Number(e.target.value))}
              className="w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-transparent border-0 shadow-sm"
              placeholder=""
            />
            <label
              className={`absolute left-6 transition-all duration-200 pointer-events-none ${
                formData.min_price
                  ? "top-3 text-xs text-gray-500"
                  : "top-1/2 translate-y-1 text-base text-gray-400"
              }`}
            >
              Minimum (£/Month)
            </label>
          </div>

          <div className="relative">
            <input
              type="number"
              value={formData.max_price || ""}
              onChange={(e) => onUpdate("max_price", Number(e.target.value))}
              className="w-full px-6 pt-8 pb-4 rounded-3xl focus:outline-none transition-all duration-200 text-gray-900 bg-white placeholder-transparent border-0 shadow-sm"
              placeholder=""
            />
            <label
              className={`absolute left-6 transition-all duration-200 pointer-events-none ${
                formData.max_price
                  ? "top-3 text-xs text-gray-500"
                  : "top-1/2 translate-y-1 text-base text-gray-400"
              }`}
            >
              Maximum (£/Month)
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PropertyTypeStep = ({ formData, onToggle }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Property type</h1>
    <p className="text-gray-500 mb-6">
      Select all property types you're interested in
    </p>

    <div className="bg-gray-50 rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-black mb-8 text-left">
        Select property types
      </h2>

      <div className="space-y-4">
        {PROPERTY_TYPE_OPTIONS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onToggle("property_type", type)}
            className={`w-full p-6 text-left rounded-3xl border-0 shadow-sm transition-colors ${
              formData.property_type?.includes(type)
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{type}</span>
              {formData.property_type?.includes(type) && (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const ApartmentSpecStep = ({ formData, onUpdate }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">
      Specify your apartment
    </h1>
    <p className="text-gray-500 mb-6">
      Select how you'll be using platform. For now one account - one role
    </p>

    <div className="text-left">
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-black mb-8 text-left">
          Bedrooms and furnishing
        </h2>

        <div className="space-y-8">
          <BedroomsDropdown
            label="Bedrooms (min)"
            value={formData.min_bedrooms || ""}
            onChange={(value) =>
              onUpdate("min_bedrooms", value === "" ? undefined : value)
            }
            placeholder="No Preference"
            min={true}
          />

          <BedroomsDropdown
            label="Bedrooms (max)"
            value={formData.max_bedrooms || ""}
            onChange={(value) =>
              onUpdate("max_bedrooms", value === "" ? undefined : value)
            }
            placeholder="No Preference"
            min={false}
          />

          <FurnishingDropdown
            label="Furnishing"
            value={formData.furnishing || "no-preference"}
            onChange={(value) => onUpdate("furnishing", value)}
            placeholder="No Preference"
          />
        </div>
      </div>
    </div>
  </div>
);

const BuildingStyleStep = ({ formData, onToggle }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">
      Building style preferences
    </h1>
    <p className="text-gray-500 mb-16">Choose your preferred building types</p>

    <div className="bg-gray-50 rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-black mb-8 text-left">
        Building style preferences
      </h2>

      <div className="space-y-4">
        {BUILDING_STYLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle("building_style", option.value)}
            className={`w-full p-6 text-left rounded-3xl border-0 shadow-sm transition-colors ${
              formData.building_style?.includes(option.value)
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const LifestyleWellnessStep = ({ formData, onToggle }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Lifestyle & Wellness</h1>
    <p className="text-gray-500 mb-6">
      Select wellness and fitness amenities that matter to you
    </p>

    <div className="bg-gray-50 rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-black mb-8 text-left">
        Lifestyle & Wellness
      </h2>

      <div className="space-y-4">
        {LIFESTYLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle("lifestyle_features", option.value)}
            className={`w-full p-6 text-left rounded-3xl border-0 shadow-sm transition-colors ${
              formData.lifestyle_features?.includes(option.value)
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const SocialCommunityStep = ({ formData, onToggle }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Social & Community</h1>
    <p className="text-gray-500 mb-6">
      Choose social spaces and community features you'd enjoy
    </p>

    <div className="bg-gray-50 rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-black mb-8 text-left">
        Social & Community
      </h2>

      <div className="space-y-4">
        {SOCIAL_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle("social_features", option.value)}
            className={`w-full p-6 text-left rounded-3xl border-0 shadow-sm transition-colors ${
              formData.social_features?.includes(option.value)
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// New steps according to screenshots

const WorkStudyStep = ({ formData, onToggle }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Work & Study</h1>
    <p className="text-gray-500 mb-6">
      Select work and study facilities you need for productivity
    </p>

    <div className="bg-gray-50 rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-black mb-8 text-left">
        Work & Study
      </h2>

      <div className="space-y-4">
        {WORK_STUDY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle("work_features", option.value)}
            className={`w-full p-6 text-left rounded-3xl border-0 shadow-sm transition-colors ${
              formData.work_features?.includes(option.value)
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const ConvenienceStep = ({ formData, onToggle }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Convenience</h1>
    <p className="text-gray-500 mb-6">
      Choose convenience features that make daily life easier
    </p>

    <div className="bg-gray-50 rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-black mb-8 text-left">
        Convenience
      </h2>

      <div className="space-y-4">
        {CONVENIENCE_FEATURES_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle("convenience_features", option.value)}
            className={`w-full p-6 text-left rounded-3xl border-0 shadow-sm transition-colors ${
              formData.convenience_features?.includes(option.value)
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const PetFriendlyStep = ({ formData, onToggle }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Pet-Friendly</h1>
    <p className="text-gray-500 mb-6">
      Select pet-friendly amenities if you have or plan to get pets
    </p>

    <div className="bg-gray-50 rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-black mb-8 text-left">
        Pet-Friendly
      </h2>

      <div className="space-y-4">
        {PET_FRIENDLY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle("pet_friendly_features", option.value)}
            className={`w-full p-6 text-left rounded-3xl border-0 shadow-sm transition-colors ${
              formData.pet_friendly_features?.includes(option.value)
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const LuxuryPremiumStep = ({ formData, onToggle }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Luxury & Premium</h1>
    <p className="text-gray-500 mb-6">
      Choose luxury amenities and premium services you value
    </p>

    <div className="bg-gray-50 rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-black mb-8 text-left">
        Luxury & Premium
      </h2>

      <div className="space-y-4">
        {LUXURY_PREMIUM_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle("luxury_features", option.value)}
            className={`w-full p-6 text-left rounded-3xl border-0 shadow-sm transition-colors ${
              formData.luxury_features?.includes(option.value)
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const IdealLivingStep = ({ formData, onUpdate }: any) => {
  const handleToggle = (value: string) => {
    const currentValues = formData.ideal_living_environment || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    onUpdate("ideal_living_environment", newValues);
  };

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-black mb-4">
        Ideal Living Environment
      </h1>
      <p className="text-gray-500 mb-6">
        The type of household atmosphere you prefer (select multiple)
      </p>

      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-black mb-8 text-left">
          Ideal Living Environment
        </h2>

        <div className="space-y-4">
          {IDEAL_LIVING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              className={`w-full p-6 text-left rounded-3xl border-0 shadow-sm transition-colors ${
                (formData.ideal_living_environment || []).includes(option.value)
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const SmokingStep = ({ formData, onUpdate }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Smoking</h1>
    <p className="text-gray-500 mb-6">
      Important for matching with smoke-friendly accommodations
    </p>

    <div className="bg-gray-50 rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-black mb-8 text-left">
        Do you smoke?
      </h2>

      <div className="space-y-4">
        {SMOKING_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onUpdate("smoker", option.value)}
            className={`w-full p-6 text-left rounded-3xl border-0 shadow-sm transition-colors ${
              formData.smoker === option.value
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const PersonalPreferencesStep = ({ formData, onToggle }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">Personal Preferences</h1>
    <p className="text-gray-500 mb-6">
      Tell us about yourself and your living preferences
    </p>

    <div className="bg-gray-50 rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-black mb-4 text-left">
        Hobbies & Interests
      </h2>
      <p className="text-blue-500 text-sm mb-8">
        Select activities you enjoy (helps match you with like-minded
        housemates)
      </p>

      <div className="grid grid-cols-3 gap-4">
        {HOBBY_ICON_OPTIONS.map((hobby) => (
          <button
            key={hobby.value}
            type="button"
            onClick={() => onToggle("hobbies", hobby.value)}
            className={`p-4 rounded-3xl border-0 shadow-sm transition-colors text-center ${
              formData.hobbies?.includes(hobby.value)
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            <div className="text-2xl mb-2">{hobby.icon}</div>
            <div className="text-sm font-medium">{hobby.label}</div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const AboutYouStep = ({ formData, onUpdate }: any) => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-black mb-4">About you</h1>
    <p className="text-gray-500 mb-6">
      Tell potential landlords and housemates about yourself (optional)
    </p>

    <div className="text-left">
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-black mb-8 text-left">
          Tell about yourself
        </h2>

        <textarea
          value={formData.additional_info || ""}
          onChange={(e) => onUpdate("additional_info", e.target.value)}
          placeholder="e.g., I'm a quiet professional who enjoys cooking and reading. I keep a clean living space and am always respectful of neighbors. I'm looking for a peaceful home environment where I can relax after work..."
          rows={8}
          className="w-full p-4 border-0 rounded-3xl text-gray-700 placeholder-gray-400 bg-white resize-none shadow-sm"
        />
      </div>
    </div>
  </div>
);
