"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Heart,
  LogOut,
  ChevronDown,
  Bell,
  Home,
  Search,
} from "lucide-react";
import { useTranslations } from "../lib/language-context";
import { selectUser } from "../store/slices/authSlice";
import { logout } from "../store/slices/authSlice";

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

const DropdownItem: React.FC<DropdownItemProps> = ({
  icon,
  label,
  onClick,
  color = "text-slate-300 hover:text-white",
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-700/50 rounded-lg ${color}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default function DashboardHeader() {
  const t = useTranslations();
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector(selectUser);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.full_name) return "U";
    return user.full_name
      .trim()
      .split(" ")
      .filter((name) => name.length > 0)
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get display name
  const getDisplayName = () => {
    if (!user?.full_name) return "Loading...";
    return user.full_name;
  };

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  console.log("user", user);
  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("accessToken");
    localStorage.removeItem("sessionExpiry");
    router.push("/app/auth/login");
    setIsDropdownOpen(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsDropdownOpen(false);
  };

  const handleLogoClick = () => {
    if (user?.roles?.includes("operator")) {
      router.push("/app/dashboard/operator");
    } else {
      router.push("/app/dashboard/tenant");
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center group-hover:bg-slate-800 transition-colors">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">TA DA</h1>
              <p className="text-xs text-slate-500 -mt-1">Rental Platform</p>
            </div>
          </button>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {getUserInitials()}
                </div>

                {/* User Info */}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user?.roles?.includes("operator")
                      ? "Property Operator"
                      : "Tenant"}
                  </p>
                </div>

                {/* Dropdown Arrow */}
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {getDisplayName()}
                        </p>
                        <p className="text-sm text-slate-500">
                          {user?.email || "Loading..."}
                        </p>
                        <p className="text-xs text-emerald-600 font-medium">
                          {user?.roles?.includes("operator")
                            ? "Property Operator"
                            : "Tenant"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2 px-2">
                    <DropdownItem
                      icon={<User className="w-4 h-4" />}
                      label="Profile Summary"
                      onClick={() => handleNavigation("/app/summary")}
                      color="text-slate-700 hover:text-slate-900"
                    />

                    <DropdownItem
                      icon={<Settings className="w-4 h-4" />}
                      label="Profile Settings"
                      onClick={() => handleNavigation("/app/profile")}
                      color="text-slate-700 hover:text-slate-900"
                    />

                    {user?.roles?.includes("admin") && (
                      <DropdownItem
                        icon={<Settings className="w-4 h-4" />}
                        label="Admin Panel"
                        onClick={() => handleNavigation("/app/dashboard/admin")}
                        color="text-amber-700 hover:text-amber-900"
                      />
                    )}

                    {!user?.roles?.includes("operator") && (
                      <>
                        <div className="border-t border-slate-100 my-2 mx-2"></div>
                        <DropdownItem
                          icon={<Search className="w-4 h-4" />}
                          label="Preferences"
                          onClick={() => handleNavigation("/app/preferences")}
                          color="text-slate-700 hover:text-slate-900"
                        />
                        <DropdownItem
                          icon={<Heart className="w-4 h-4" />}
                          label="My Shortlist"
                          onClick={() => handleNavigation("/app/shortlist")}
                          color="text-slate-700 hover:text-slate-900"
                        />
                      </>
                    )}

                    <div className="border-t border-slate-100 my-2 mx-2"></div>

                    <DropdownItem
                      icon={<LogOut className="w-4 h-4" />}
                      label="Sign Out"
                      onClick={handleLogout}
                      color="text-red-600 hover:text-red-700 hover:bg-red-50"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
