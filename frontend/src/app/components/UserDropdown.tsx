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

      {/* Dropdown Menu - Dark Glassmorphism Style */}
      {isMounted && isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-50 overflow-hidden bg-black/10 backdrop-blur-lg">
          {/* Dark glass background overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/20 backdrop-blur-lg -z-10"></div>
          {/* Additional dark glass layer */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-md -z-10"></div>

          {/* User Info */}
          {!simplified && (
            <div className="p-4 border-b border-white/10 relative">
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-base font-medium text-white flex-shrink-0 border border-white/20 shadow-lg">
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
                          const initials = parent.querySelector(
                            ".fallback-initials-large",
                          );
                          if (initials) {
                            (initials as HTMLElement).style.display = "flex";
                          }
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`fallback-initials-large absolute inset-0 flex items-center justify-center ${
                      user.avatar_url ? "hidden" : ""
                    }`}
                  >
                    {initials}
                  </div>
                </div>
                <div className="flex flex-col">
                  <p className="text-base font-semibold text-white">
                    {displayName}
                  </p>
                  <p className="text-sm text-white/80">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="p-2 relative">
            {!simplified && (
              <>
                <button
                  onClick={handleSettings}
                  className="flex cursor-pointer items-center w-full px-4 py-3 text-sm text-white hover:backdrop-blur-md rounded-lg font-medium"
                >
                  <Settings className="w-4 h-4 mr-3 text-white/80" />
                  {t(profileKeys.dropProfileSettings)}
                </button>

                <button
                  onClick={handlePreferences}
                  className="flex cursor-pointer items-center w-full px-4 py-3 text-sm text-white hover:backdrop-blur-md rounded-lg font-medium"
                >
                  <Sliders className="w-4 h-4 mr-3 text-white/80" />
                  {t(profileKeys.dropChangePreferences)}
                </button>

                <button
                  onClick={handleTenantCv}
                  className="flex cursor-pointer items-center w-full px-4 py-3 text-sm text-white hover:backdrop-blur-md rounded-lg font-medium"
                >
                  <FileText className="w-4 h-4 mr-3 text-white/80" />
                  {t(tenantCvKeys.tenantCvButton)}
                </button>

                <hr className="my-2 border-white/10" />
              </>
            )}

            <button
              onClick={handleLogout}
              className="flex cursor-pointer items-center w-full px-4 py-3 text-sm text-red-400 hover:backdrop-blur-md rounded-lg font-medium"
            >
              <LogOut className="w-4 h-4 mr-3" />
              {t(profileKeys.dropLogout)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
