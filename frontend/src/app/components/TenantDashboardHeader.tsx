"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Search, Settings, Heart, Bell, ChevronDown } from "lucide-react";
import { selectUser } from "../store/slices/authSlice";
import Logo from "./Logo";

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
  const user = useSelector(selectUser);
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
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
              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 text-white rounded-lg shadow-lg z-50 py-2">
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
                      className={`block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                        selectedLanguage === lang.code ? "bg-gray-700" : ""
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getUserInitials(user?.full_name, user?.email)}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-100">
                  <p className="font-medium text-gray-900">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      router.push("/app/profile");
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      router.push("/app/preferences");
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Preferences
                  </button>
                  <button
                    onClick={() => {
                      router.push("/app/security");
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for dropdowns */}
      {(isDropdownOpen || isLanguageOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsDropdownOpen(false);
            setIsLanguageOpen(false);
          }}
        />
      )}
    </header>
  );
}
