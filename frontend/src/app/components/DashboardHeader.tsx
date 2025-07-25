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
import Logo from "./Logo";
import { getUserRole } from "../utils/simpleRedirect";

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

  console.log("user", user);
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

    // Use the existing getUserRole function to determine the correct dashboard
    const userRole = getUserRole(user);

    switch (userRole) {
      case "admin":
        router.push("/app/dashboard/admin");
        break;
      case "operator":
        router.push("/app/dashboard/operator");
        break;
      case "tenant":
      default:
        router.push("/app/dashboard/tenant");
        break;
    }
  };

  // Get user role using the proper function
  const userRole = getUserRole(user);
  const isAdmin = userRole === "admin";

  console.log("user", user, "userRole", userRole);
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className=" px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <Logo size="md" />
            <div>
              <p className="text-xs text-slate-500 -mt-1">Rental Platform</p>
            </div>
          </button>

          {/* Admin Navigation */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => handleNavigation("/app/dashboard/admin")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    pathname === "/app/dashboard/admin"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  Admin Dashboard
                </button>
                <button
                  onClick={() =>
                    handleNavigation("/app/dashboard/admin/tenant")
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    pathname === "/app/dashboard/admin/tenant"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Tenant Dashboard
                </button>
                <button
                  onClick={() =>
                    handleNavigation("/app/dashboard/admin/operator")
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    pathname === "/app/dashboard/admin/operator"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Operator Dashboard
                </button>
                <button
                  onClick={() => handleNavigation("/app/admin/panel")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    pathname === "/app/admin/panel"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Admin Panel
                </button>
              </div>
            </div>
          )}

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

                    {userRole === "admin" && (
                      <DropdownItem
                        icon={<Settings className="w-4 h-4" />}
                        label="Administrator Panel"
                        onClick={() => handleNavigation("/app/dashboard/admin")}
                        color="text-amber-700 hover:text-amber-900"
                      />
                    )}

                    {userRole === "tenant" && user?.tenantProfile && (
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
