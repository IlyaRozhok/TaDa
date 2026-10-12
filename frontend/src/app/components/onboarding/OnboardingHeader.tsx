"use client";

import LanguageDropdown from "@/app/components/LanguageDropdown";
import UserDropdown from "@/app/components/UserDropdown";

/**
 * The header of the onboarding flow: logo, language (the landing's list,
 * persisted via I18nContext/localStorage) and the simplified user menu.
 * Shared with the phone verification screen, which comes before onboarding.
 */
export default function OnboardingHeader() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 py-0.75 sm:py-1">
      <div className="max-w-4xl lg:max-w-none mx-auto flex items-center justify-between px-8 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <div className="flex items-center">
          <button className="transition-opacity hover:opacity-80 cursor-pointer">
            <img
              src="/black-logo.svg"
              alt="TADA Logo"
              className="h-6 sm:h-7 lg:h-8"
            />
          </button>
        </div>

        {/* Right: Language + Profile */}
        <div className="flex items-center space-x-0.75 sm:space-x-1">
          {/* Language Dropdown - same list as landing, persists via I18nContext/localStorage */}
          <LanguageDropdown variant="default" />

          {/* User Dropdown - Simplified */}
          <UserDropdown simplified={true} />
        </div>
      </div>
    </nav>
  );
}
