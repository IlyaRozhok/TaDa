"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useTranslation } from "../hooks/useTranslation";
import { selectUser } from "../store/slices/authSlice";
import { tenantCvKeys } from "@/app/lib/translationsKeys/tenantCvTranslationKeys";
import { Heart, Settings, ChevronDown, ArrowLeft, Shield } from "lucide-react";
import UserDropdown from "./UserDropdown";
import { getRedirectPath } from "../utils/simpleRedirect";

interface TenantUniversalHeaderProps {
  preferencesCount?: number;
  showSaveButton?: boolean;
  onSaveClick?: () => void;
  showPreferencesButton?: boolean;
  showTenantCvLink?: boolean;
  showFavouritesButton?: boolean;
}

export default function TenantUniversalHeader({
  preferencesCount = 0,
  showSaveButton = false,
  onSaveClick,
  showPreferencesButton = true,
  showTenantCvLink = true,
  showFavouritesButton = true,
}: TenantUniversalHeaderProps) {
  const router = useRouter();
  const user = useSelector(selectUser);
  const { t } = useTranslation();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    const path = getRedirectPath(user);
    router.push(path);
  };

  const handleFavouritesClick = () => {
    router.push("/app/shortlist");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-5 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-2">
      <div className="w-full mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Logo - clickable to dashboard */}
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={handleLogoClick}
            className="transition-opacity hover:opacity-80 cursor-pointer"
          >
            <img
              src="/black-logo.svg"
              alt="TADA Logo"
              className="h-6 sm:h-7 md:h-8"
            />
          </button>
        </div>

        {/* Right: Icons - Adaptive layout */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6 flex-shrink-0">
          {/* Admin Panel Button - Show for admin users */}
          {user?.role === "admin" && (
            <button
              onClick={() => router.push("/app/admin/panel")}
              className="cursor-pointer flex items-center gap-1 sm:gap-2 px-5 py-3 sm:py-2 bg-gradient-to-r from-green-900 to-black hover:from-green-900 hover:to-black/90 rounded-3xl transition-all duration-200 text-xs sm:text-sm font-medium text-white whitespace-nowrap hover:shadow-lg active:scale-95"
            >
              <Shield className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}

          {/* Preferences Button - Beautiful mobile design */}
          {showPreferencesButton && (
            <button
              onClick={() => router.push("/app/preferences")}
              className="cursor-pointer flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-4 py-2 sm:py-2 bg-black hover:bg-gray-900 rounded-3xl transition-all duration-200 text-xs sm:text-sm font-medium text-white whitespace-nowrap shadow-md hover:shadow-lg active:scale-95"
            >
              <Settings className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Your preferences</span>
              {preferencesCount > 0 && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs px-2 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold border border-white/30">
                  {preferencesCount}%
                </span>
              )}
            </button>
          )}

          {/* Tenant CV Link */}
          {showTenantCvLink && (
            <button
              onClick={() => router.push("/app/tenant-cv")}
              className="cursor-pointer px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-black hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs sm:text-sm md:text-base font-medium whitespace-nowrap"
            >
              {t(tenantCvKeys.tenantCvButton)}
            </button>
          )}

          {/* Favourites */}
          {showFavouritesButton && (
            <button
              onClick={handleFavouritesClick}
              className="p-1.5 sm:p-2 cursor-pointer text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Language Dropdown */}
          <div className="relative language-dropdown" ref={dropdownRef}>
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{selectedLanguage}</span>
              <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>

            {isLanguageOpen && (
              <div
                className="absolute right-0 top-full mt-1 sm:mt-2 rounded-xl min-w-[100px] sm:min-w-[120px] z-50 overflow-hidden backdrop-blur-[3px]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), rgba(0, 0, 0, 0.5)",
                  boxShadow:
                    "0 1.5625rem 3.125rem rgba(0, 0, 0, 0.4), 0 0.625rem 1.875rem rgba(0, 0, 0, 0.2), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.1), inset 0 -0.0625rem 0 rgba(0, 0, 0, 0.2)",
                }}
              >
                <div className="max-h-40 overflow-y-auto rounded-xl relative">
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
                      className={`block w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 rounded-lg ${
                        selectedLanguage === lang.code
                          ? "bg-white/18 text-white font-semibold"
                          : "text-white hover:bg-white/12"
                      }`}
                      style={{
                        backdropFilter:
                          selectedLanguage === lang.code
                            ? "blur(10px)"
                            : undefined,
                        fontWeight:
                          selectedLanguage === lang.code ? 600 : undefined,
                      }}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          {showSaveButton && (
            <button
              onClick={onSaveClick}
              className="cursor-pointer text-gray-600 border border-gray-200 rounded-lg px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 hover:text-black hover:bg-gray-100 transition-colors text-xs sm:text-sm md:text-base font-medium whitespace-nowrap"
            >
              Save
            </button>
          )}

          {/* User Dropdown */}
          <UserDropdown />
        </div>
      </div>
    </nav>
  );
}
