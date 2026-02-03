"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "../hooks/useTranslation";
import { selectUser } from "../store/slices/authSlice";
import { logout } from "../store/slices/authSlice";
import { authAPI } from "../lib/api";
import { profileKeys } from "@/app/lib/translationsKeys/profileTranslationKeys";
import { tenantCvKeys } from "@/app/lib/translationsKeys/tenantCvTranslationKeys";
import { LogOut, Settings, Sliders, Mail, FileText } from "lucide-react";

interface UserDropdownProps {
  simplified?: boolean;
}

export default function UserDropdown({
  simplified = false,
}: UserDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      console.log("🔄 Starting logout process...");

      // Закрываем dropdown
      setIsOpen(false);

      // Вызываем API logout
      await authAPI.logout();
      console.log("✅ API logout successful");
    } catch (error) {
      console.error("❌ Logout API error:", error);
      // Продолжаем logout даже если API не ответил
    } finally {
      try {
        // Очищаем Redux состояние
        dispatch(logout());
        console.log("✅ Redux state cleared");

        // Очищаем все localStorage данные
        localStorage.clear();
        console.log("✅ LocalStorage cleared");

        // Перенаправляем на главную страницу
        router.push("/");
        console.log("✅ Redirected to home page");
      } catch (error) {
        console.error("❌ Error during logout cleanup:", error);
        // В крайнем случае просто перезагружаем страницу
        window.location.href = "/";
      }
    }
  };

  const handleSettings = () => {
    setIsOpen(false);
    router.push("/app/profile");
  };

  const handlePreferences = () => {
    setIsOpen(false);
    router.push("/app/preferences");
  };

  const handleTenantCv = () => {
    setIsOpen(false);
    router.push("/app/tenant-cv");
  };

  const handleSupport = () => {
    setIsOpen(false);
    // Можно добавить логику для поддержки
    console.log("Support clicked");
  };

  if (!user) {
    return null;
  }

  const displayName = user.full_name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar/Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-end cursor-pointer gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors ${
          simplified ? "" : ""
        }`}
      >
        <div className="relative w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const initialsEl = parent.querySelector(".fallback-initials");
                  if (initialsEl) {
                    (initialsEl as HTMLElement).style.display = "flex";
                  }
                }
              }}
            />
          ) : null}
          <div
            className={`fallback-initials absolute inset-0 flex items-center justify-center ${
              user.avatar_url ? "hidden" : ""
            }`}
          >
            {initials}
          </div>
        </div>
        {!simplified && (
          <span className="text-sm text-gray-700 hidden sm:block">
            {displayName}
          </span>
        )}
      </button>

      {/* Dropdown Menu - Same style as mobile menu */}
      {isMounted && isOpen && (
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
            {!simplified && (
              <>
                <button
                  onClick={handleSettings}
                  className="flex w-full cursor-pointer items-center px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 rounded-lg text-white hover:bg-white/12"
                >
                  <Settings className="w-4 h-4 mr-3 flex-shrink-0" />
                  {t(profileKeys.dropProfileSettings)}
                </button>

                <button
                  onClick={handlePreferences}
                  className="flex w-full cursor-pointer items-center px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 rounded-lg text-white hover:bg-white/12"
                >
                  <Sliders className="w-4 h-4 mr-3 flex-shrink-0" />
                  {t(profileKeys.dropChangePreferences)}
                </button>

                <button
                  onClick={handleTenantCv}
                  className="flex w-full cursor-pointer items-center px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 rounded-lg text-white hover:bg-white/12"
                >
                  <FileText className="w-4 h-4 mr-3 flex-shrink-0" />
                  {t(tenantCvKeys.tenantCvButton)}
                </button>

                <hr className="my-1 border-white/10" />
              </>
            )}

            <button
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 rounded-lg text-red-400 hover:bg-white/12"
            >
              <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
              {t(profileKeys.dropLogout)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
