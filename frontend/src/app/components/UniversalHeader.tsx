"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Heart, Bell, ChevronDown } from "lucide-react";
import UserDropdown from "./UserDropdown";
import styles from "./ui/DropdownStyles.module.scss";
import { selectUser } from "../store/slices/authSlice";
import { getRedirectPath } from "../utils/simpleRedirect";

export default function UniversalHeader() {
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo - clickable to dashboard */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={handleLogoClick}
              className="text-gray-900 text-sm sm:text-lg md:text-xl font-semibold transition-colors hover:text-gray-700"
            >
              <img
                src="/black-logo.svg"
                alt="TADA Logo"
                className="h-6 pl-5 cursor-pointer"
              />
            </button>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleFavouritesClick}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <Heart className="h-5 w-5" />
            </button>
            <button className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>

            {/* Language Dropdown */}
            <div className="relative language-dropdown">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors rounded-lg w-14 border border-gray-200 hover:bg-gray-50"
              >
                <span className="min-w-[1.5rem] text-center">
                  {selectedLanguage}
                </span>
                <ChevronDown
                  className={`w-3 h-3 flex-shrink-0 transition-transform ${
                    isLanguageOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isLanguageOpen && (
                <div className="absolute right-0 top-full mt-2 rounded-lg shadow-lg bg-white border border-gray-200 min-w-[150px] z-50">
                  <div className="max-h-80 overflow-y-auto rounded-lg">
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
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
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
