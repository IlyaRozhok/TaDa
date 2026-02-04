"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useTranslation } from "../hooks/useTranslation";
import LanguageDropdown from "./LanguageDropdown";
import { selectUser } from "../store/slices/authSlice";
import { tenantCvKeys } from "@/app/lib/translationsKeys/tenantCvTranslationKeys";
import { Settings, Shield, MoreVertical, User, FileText } from "lucide-react";
import UserDropdown from "./UserDropdown";
import { getRedirectPath } from "../utils/simpleRedirect";
import { profileKeys } from "@/app/lib/translationsKeys/profileTranslationKeys";

interface TenantUniversalHeaderProps {
  preferencesCount?: number;
  showSaveButton?: boolean;
  onSaveClick?: () => void;
  showPreferencesButton?: boolean;
  showTenantCvLink?: boolean;
  showFavouritesButton?: boolean;
  showBackButton?: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export default function TenantUniversalHeader({
  preferencesCount = 0,
  showSaveButton = false,
  onSaveClick,
  showPreferencesButton = true,
  showTenantCvLink = true,
  showFavouritesButton = true,
  showBackButton = false,
  searchTerm = "",
  onSearchChange,
}: TenantUniversalHeaderProps) {
  const router = useRouter();
  const user = useSelector(selectUser);
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  const handleLogoClick = () => {
    const path = getRedirectPath(user);
    router.push(path);
  };

  const handleMobileMenuClick = (path: string) => {
    setIsMobileMenuOpen(false);
    router.push(path);
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
          {/* Admin Panel - same style as Tenant CV / Preferences / Units links */}
          {user?.role === "admin" && (
            <button
              onClick={() => router.push("/app/admin/panel")}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* Language Dropdown */}
          <LanguageDropdown variant="default" />

          {/* Save Button */}
          {showSaveButton && (
            <button
              onClick={onSaveClick}
              className="cursor-pointer text-gray-600 border border-gray-200 rounded-lg px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 hover:text-black hover:bg-gray-100 transition-colors text-xs sm:text-sm md:text-base font-medium whitespace-nowrap"
            >
              Save
            </button>
          )}

          {/* Mobile Menu (3 dots) - visible only on mobile */}
          <div className="relative md:hidden" ref={mobileMenuRef}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 cursor-pointer text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Mobile Menu Dropdown - styled like LanguageDropdown */}
            {isMobileMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 sm:mt-2 rounded-xl min-w-[200px] sm:min-w-[240px] z-50 overflow-hidden backdrop-blur-[3px]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), rgba(0, 0, 0, 0.5)",
                  boxShadow:
                    "0 1.5625rem 3.125rem rgba(0, 0, 0, 0.4), 0 0.625rem 1.875rem rgba(0, 0, 0, 0.2), inset 0 0.0625rem 0 rgba(255, 255, 255, 0.1), inset 0 -0.0625rem 0 rgba(0, 0, 0, 0.2)",
                }}
              >
                <div className="max-h-64 overflow-y-auto rounded-xl relative">
                  <button
                    onClick={() => handleMobileMenuClick("/app/profile")}
                    className="flex w-full cursor-pointer items-center px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 rounded-lg text-white hover:bg-white/12"
                  >
                    <User className="w-4 h-4 mr-3 flex-shrink-0" />
                    {t(profileKeys.dropProfileSettings)}
                  </button>

                  <button
                    onClick={() => handleMobileMenuClick("/app/preferences")}
                    className="flex w-full cursor-pointer items-center px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 rounded-lg text-white hover:bg-white/12"
                  >
                    <Settings className="w-4 h-4 mr-3 flex-shrink-0" />
                    {t(profileKeys.dropChangePreferences)}
                  </button>

                  <button
                    onClick={() => handleMobileMenuClick("/app/tenant-cv")}
                    className="flex w-full cursor-pointer items-center px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 rounded-lg text-white hover:bg-white/12"
                  >
                    <FileText className="w-4 h-4 mr-3 flex-shrink-0" />
                    {t(tenantCvKeys.tenantCvButton)}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown - visible only on desktop */}
          <div className="hidden md:block">
            <UserDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}
