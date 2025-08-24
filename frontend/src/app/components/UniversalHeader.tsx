"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Bell, ChevronDown } from "lucide-react";
import UserDropdown from "./UserDropdown";
import styles from "./ui/DropdownStyles.module.scss";

export default function UniversalHeader() {
  const router = useRouter();
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
    router.push("/app/dashboard/tenant");
  };

  const handleFavouritesClick = () => {
    router.push("/app/shortlist");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-[95%] mx-auto flex items-center justify-between">
        {/* Left: Logo - clickable to dashboard */}
        <div className="flex items-center">
          <button
            onClick={handleLogoClick}
            className="text-2xl font-bold text-black hover:text-gray-700 transition-colors"
          >
            :: TADA
          </button>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleFavouritesClick}
            className="text-black hover:text-gray-600 transition-colors"
          >
            <Heart className="h-6 w-6" />
          </button>
          <button className="text-black hover:text-gray-600 transition-colors">
            <Bell className="h-6 w-6" />
          </button>

          {/* Language Dropdown */}
          <div className="relative language-dropdown">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>{selectedLanguage}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isLanguageOpen && (
              <div
                className={`absolute right-0 top-full ${styles.dropdownContainer}`}
              >
                <div className="max-h-80 overflow-y-auto">
                  {[
                    { code: "EN", name: "English" },
                    { code: "FR", name: "Français" },
                    { code: "ES", name: "Español" },
                    { code: "IT", name: "Italiano" },
                    { code: "NL", name: "Nederlands" },
                    { code: "PT", name: "Português" },
                    { code: "RU", name: "Русский" },
                    { code: "ZH", name: "中文" },
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

          {/* User Dropdown */}
          <UserDropdown />
        </div>
      </div>
    </nav>
  );
}
