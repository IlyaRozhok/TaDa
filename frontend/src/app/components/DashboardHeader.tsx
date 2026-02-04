"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import {
  User,
  Settings,
  Heart,
  LogOut,
  ChevronDown,
  Bell,
  Search,
  Shield,
  Users,
  Building2,
} from "lucide-react";
import { selectUser } from "../store/slices/authSlice";
import { logout } from "../store/slices/authSlice";
import styles from "./ui/DropdownStyles.module.scss";
import { getRedirectPath, getUserRole } from "../utils/simpleRedirect";

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
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector(selectUser);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user initials for avatar
  const getUserInitials = () => {
    const displayName = getDisplayName();
    if (displayName === "User") return "U";

    return displayName
      .trim()
      .split(" ")
      .filter((name) => name.length > 0)
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get display name with better fallback logic
  const getDisplayName = () => {
    // Try user.full_name first
    if (user?.full_name) return user.full_name;

    // Try profile-based name
    const profileName =
      user?.tenantProfile?.full_name || user?.operatorProfile?.full_name;
    if (profileName) return profileName;

    // Fallback to email username
    if (user?.email) {
      const emailUsername = user.email.split("@")[0];
      return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }

    return "User";
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

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("accessToken");
    localStorage.removeItem("sessionExpiry");
    router.push("/");
    setIsDropdownOpen(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsDropdownOpen(false);
  };

  const handleLogoClick = () => {
    if (!user) return;

    const path = getRedirectPath(user);
    router.replace(path);
  };

  // Get user role using the proper function
  const userRole = getUserRole(user);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className=" px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img
              src="/black-logo.svg"
              alt="TADA Logo"
              className="h-7 sm:h-8"
            />
          </button>

          {/* Admin Navigation removed; links moved to profile dropdown */}

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
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          const initials = parent.querySelector(
                            ".fallback-initials-header"
                          );
                          if (initials) {
                            (initials as HTMLElement).style.display = "flex";
                          }
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`fallback-initials-header w-full h-full flex items-center justify-center ${
                      user?.avatar_url ? "hidden" : ""
                    }`}
                  >
                    {getUserInitials()}
                  </div>
                </div>

                {/* User Info */}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {userRole === "admin"
                      ? "Administrator"
                      : userRole === "operator"
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
                <div
                  className={`absolute right-0 top-full ${styles.dropdownContainer}`}
                >
                  {/* User Info Header */}
                  <div className={styles.dropdownHeader}>
                    <div className="flex items-center gap-3">
                      <div className={styles.userInfo}>
                        <p className={styles.userName}>{getDisplayName()}</p>
                        <p className={styles.userEmail}>
                          {user?.email || "Loading..."}
                        </p>
                        <p className={styles.userRole}>
                          {userRole === "admin"
                            ? "Administrator"
                            : userRole === "operator"
                            ? "Property Operator"
                            : "Tenant"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className={styles.dropdownBody}>
                    <DropdownItem
                      icon={<Settings className="w-4 h-4" />}
                      label="Profile Settings"
                      onClick={() => handleNavigation("/app/profile")}
                      color="text-slate-700 hover:text-slate-900"
                    />

                    {/* Admin-specific navigation moved here */}
                    {(userRole === "admin" || userRole === "operator") && (
                      <>
                        <hr className={styles.dropdownDivider} />
                        <DropdownItem
                          icon={<Shield className="w-4 h-4" />}
                          label="Admin Panel"
                          onClick={() => handleNavigation("/app/admin/panel")}
                          color="text-slate-700 hover:text-slate-900"
                        />
                        <DropdownItem
                          icon={<Users className="w-4 h-4" />}
                          label="Tenant Dashboard"
                          onClick={() =>
                            handleNavigation("/app/dashboard/admin/tenant")
                          }
                          color="text-slate-700 hover:text-slate-900"
                        />
                        <DropdownItem
                          icon={<Building2 className="w-4 h-4" />}
                          label="Operator Dashboard"
                          onClick={() =>
                            handleNavigation("/app/dashboard/admin/operator")
                          }
                          color="text-slate-700 hover:text-slate-900"
                        />
                      </>
                    )}

                    {userRole === "tenant" && user?.tenantProfile && (
                      <>
                        <hr className={styles.dropdownDivider} />
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

                    <hr className={styles.dropdownDivider} />

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
