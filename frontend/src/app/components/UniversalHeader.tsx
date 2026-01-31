"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Heart, Bell, ChevronDown } from "lucide-react";
import UserDropdown from "./UserDropdown";
import styles from "./ui/DropdownStyles.module.scss";
import { selectUser } from "../store/slices/authSlice";
import { getRedirectPath } from "../utils/simpleRedirect";
import {
  useI18n,
  SUPPORTED_LANGUAGES,
  getLanguageDisplayCode,
} from "../contexts/I18nContext";

export default function UniversalHeader() {
  const router = useRouter();
  const user = useSelector(selectUser);
  const { language, setLanguage } = useI18n();
  const selectedLanguage = getLanguageDisplayCode(language);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  // Close language dropdown when clicking outside
  useEffect(() => {
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

  const handleLogoClick = () => {
    const path = getRedirectPath(user);
    router.replace(path);
  };

  const handleFavouritesClick = () => {
    router.push("/app/shortlist");
  };

  return (
    <header className="fixed top-0 left-0 px-4 right-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="w-full px-1 sm:px-1.5 lg:px-2 py-0.75 sm:py-1">
        <div className="flex items-center justify-between">
          {/* Left: Logo - clickable to dashboard */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={handleLogoClick}
              className="text-gray-900 text-lg sm:text-xl font-semibold transition-colors hover:text-gray-700 py-0.5"
            >
              <img
                src="/black-logo.svg"
                alt="TADA Logo"
                className="h-6 sm:h-7 cursor-pointer"
              />
            </button>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-0.5 sm:gap-0.75">
            <button
              onClick={handleFavouritesClick}
              className="text-gray-600 hover:text-gray-900 transition-colors p-0.75 rounded-lg hover:bg-gray-100 min-h-touch-sm min-w-[2.25rem] flex items-center justify-center"
              aria-label="Shortlist"
            >
              <Heart className="h-1.25 w-1.25" />
            </button>
            <button
              className="text-gray-600 hover:text-gray-900 transition-colors p-0.75 rounded-lg hover:bg-gray-100 min-h-touch-sm min-w-[2.25rem] flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="h-1.25 w-1.25" />
            </button>

            {/* Language Dropdown */}
            <div className="relative language-dropdown">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center justify-center gap-0.5 px-1 py-0.75 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors rounded-lg min-w-[3.5rem] border border-gray-200 hover:bg-gray-50 min-h-touch-sm"
                aria-label="Select language"
              >
                <span className="text-center">{selectedLanguage}</span>
                <ChevronDown
                  className={`w-1 h-1 flex-shrink-0 transition-transform ${
                    isLanguageOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isLanguageOpen && (
                <div className="absolute right-0 mt-0.5 min-w-[240px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1 max-h-80 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.langCode);
                          setIsLanguageOpen(false);
                        }}
                        className={`w-full text-left px-1 py-0.75 text-sm transition-colors min-h-touch-sm ${
                          selectedLanguage === lang.code
                            ? "bg-gray-100 font-semibold text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
