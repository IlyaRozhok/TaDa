"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  Heart,
  Bell,
  ChevronDown,
  Search,
  Settings,
  ArrowLeft,
} from "lucide-react";
import UserDropdown from "./UserDropdown";
import styles from "./ui/DropdownStyles.module.scss";
import { selectUser } from "../store/slices/authSlice";
import { getRedirectPath } from "../utils/simpleRedirect";

interface TenantUniversalHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  preferencesCount?: number;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showSaveButton?: boolean;
  onSaveClick?: () => void;
  showSearchInput?: boolean;
  showPreferencesButton?: boolean;
  showTenantCvLink?: boolean;
}

export default function TenantUniversalHeader({
  searchTerm,
  onSearchChange,
  preferencesCount = 0,
  showBackButton = false,
  onBackClick,
  showSaveButton = false,
  onSaveClick,
  showSearchInput = true,
  showPreferencesButton = true,
  showTenantCvLink = true,
}: TenantUniversalHeaderProps) {
  const router = useRouter();
  const user = useSelector(selectUser);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-[95%] mx-auto flex items-center justify-between">
        {/* Left: Logo - clickable to dashboard */}
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
          )}
          <button
            onClick={handleLogoClick}
            className="text-2xl font-bold text-black hover:text-gray-700 transition-colors cursor-pointer"
          >
            :: TADA
          </button>
        </div>

        {/* Center: Search */}
        {showSearchInput && (
          <div className="flex-1 flex items-center justify-center gap-4 max-w-2xl mx-8">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search property, location, or type of property"
                className="text-slate-900 w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}

        {/* Right: Icons */}
        <div className="flex items-center space-x-4 cursor-pointer">
          {/* Preferences Button */}
          {showPreferencesButton && (
            <button
              onClick={() => router.push("/app/preferences")}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium text-white"
            >
              <Settings className="w-4 h-4" />
              <span>Your preferences</span>
              {preferencesCount > 0 && (
                <span className="bg-slate-800 text-white text-xs px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {preferencesCount}%
                </span>
              )}
            </button>
          )}
          {showTenantCvLink && (
            <button
              onClick={() => router.push("/app/tenant-cv")}
              className="text-black hover:text-gray-600 transition-colors font-medium cursor-pointer"
            >
              Tenant CV
            </button>
          )}
          <button
            onClick={handleFavouritesClick}
            className="text-black hover:text-gray-600 transition-colors cursor-pointer"
          >
            <Heart className="h-6 w-6" />
          </button>

          {/* Language Dropdown */}
          <div className="relative language-dropdown">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <span>{selectedLanguage}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isLanguageOpen && (
              <div
                className={`absolute right-0 top-full ${styles.dropdownContainer}`}
              >
                <div className="max-h-80 overflow-y">
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
                      className={`${styles.dropdownItem} ${
                        selectedLanguage === lang.code ? "bg-white/20" : ""
                      }`}
                    >
                      <span className={styles.dropdownText}>{lang.name}</span>
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
              className="cursor-pointer text-gray-600 border-1 rounded-2xl px-4 py-2 hover:text-black transition-colors font-medium"
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
