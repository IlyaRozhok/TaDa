"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser } from "../store/slices/authSlice";
import { authAPI } from "../lib/api";
import { User, Settings, LogOut, Shield } from "lucide-react";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const router = useRouter();

  // Ensure component is mounted before showing dropdown
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Закрыть dropdown при клике вне его
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Очищаем состояние независимо от результата API вызова
      dispatch(logout());
      // Перенаправляем на главную страницу
      router.push("/");
    }
  };

  const handleSettings = () => {
    setIsOpen(false);
    router.push("/app/security");
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar/Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <User className="h-5 w-5 text-gray-600" />
        <span className="text-sm text-gray-700 hidden sm:block">
          {user.full_name || user.email?.split('@')[0] || 'User'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isMounted && isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              {user.full_name}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <p className="text-xs text-blue-600 mt-1">
              {user.roles?.includes("operator") ? "Оператор" : "Арендатор"}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleSettings}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-4 w-4 mr-3 text-gray-400" />
              Настройки аккаунта
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/app/security");
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Shield className="h-4 w-4 mr-3 text-gray-400" />
              Безопасность
            </button>

            <hr className="my-1 border-gray-200" />

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3 text-red-400" />
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
