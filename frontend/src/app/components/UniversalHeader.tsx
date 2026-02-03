"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Heart, Bell } from "lucide-react";
import UserDropdown from "./UserDropdown";
import styles from "./ui/DropdownStyles.module.scss";
import { selectUser } from "../store/slices/authSlice";
import { getRedirectPath } from "../utils/simpleRedirect";
import LanguageDropdown from "./LanguageDropdown";

export default function UniversalHeader() {
  const router = useRouter();
  const user = useSelector(selectUser);

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
            <LanguageDropdown
              variant="default"
              buttonClassName="min-w-[3.5rem] border border-gray-200"
            />

            {/* User Dropdown */}
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
