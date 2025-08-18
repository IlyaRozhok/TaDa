"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Settings, Heart, Bell, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import UserDropdown from "./UserDropdown";
import styles from "./ui/DropdownStyles.module.scss";

interface TenantDashboardHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  preferencesCount?: number;
}

export default function TenantDashboardHeader({
  searchTerm,
  onSearchChange,
  preferencesCount = 0,
}: TenantDashboardHeaderProps) {
  const router = useRouter();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16 max-7xl mx-2">
        {/* Logo */}
        <div className="flex items-center">
          <Logo className="h-8" />
        </div>

        {/* Search and Preferences */}
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

          {/* Preferences Button */}
          <button
            onClick={() => router.push("/app/preferences")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4 text-slate-900" />
            <span className="text-slate-900">Your preferences</span>
            {preferencesCount > 0 && (
              <span className="bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {preferencesCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-3">
          {/* Favorites */}
          <button
            onClick={() => router.push("/app/shortlist")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Heart className="w-5 h-5 text-gray-600" />
          </button>

          {/* Notifications */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>

          {/* Language Dropdown */}
          <div className="relative">
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

          {/* User Profile */}
          <UserDropdown />
        </div>
      </div>

      {/* Backdrop for dropdowns */}
      {isLanguageOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsLanguageOpen(false);
          }}
        />
      )}
    </header>
  );
}
