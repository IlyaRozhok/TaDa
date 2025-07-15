"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  propertiesAPI,
  matchingAPI,
  Property,
  MatchingResult,
} from "../../../lib/api";
import { useTranslations } from "../../../lib/language-context";
import { selectUser } from "../../../store/slices/authSlice";
import PropertyCard from "../../../components/PropertyCard";
import DashboardHeader from "../../../components/DashboardHeader";
import FeaturedPropertiesSlider from "../../../components/FeaturedPropertiesSlider";
import { useRouter } from "next/navigation";
import {
  Home,
  Search,
  TrendingUp,
  Heart,
  Target,
  Sparkles,
  User,
} from "lucide-react";
import { waitForSessionManager } from "../../../components/providers/SessionManager";

export default function TenantDashboard() {
  const user = useSelector(selectUser);
  const t = useTranslations();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [matchedProperties, setMatchedProperties] = useState<MatchingResult[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await waitForSessionManager();

        if (!user) {
          console.log("No user found, redirecting to login");
          router.push("/app/auth/login");
          return;
        }

        if (user.roles?.includes("operator")) {
          router.push("/app/dashboard/operator");
          return;
        }

        await Promise.all([fetchProperties(), fetchMatchedProperties()]);
      } catch (err) {
        console.error("Dashboard initialization error:", err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [user, router]);

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      const responseData = response.data || response;
      // Handle both array and object responses
      const propertiesData = Array.isArray(responseData)
        ? responseData
        : responseData.properties || [];
      setProperties(propertiesData.slice(0, 6));
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  const fetchMatchedProperties = async () => {
    try {
      const response = await matchingAPI.getDetailedMatches(3);
      setMatchedProperties(response);
    } catch (err) {
      console.error("Error fetching matched properties:", err);
      // If there's an error with detailed matches, set empty array to show "No matches yet"
      setMatchedProperties([]);
    }
  };

  const handlePropertyClick = (property: Property) => {
    router.push(`/app/properties/${property.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 text-sm sm:text-base">
                Loading your dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 sm:p-8 text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-red-800 mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-red-600 mb-6 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  console.log(user);
  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-gradient-to-r from-slate-600 to-violet-600 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                  Welcome back,{" "}
                  {user?.full_name ? user.full_name.split(" ")[0] : "User"}!
                </h1>
                <p className="text-sm sm:text-base">
                  Your personalized property dashboard awaits
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <button
            onClick={() => router.push("/app/preferences")}
            className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Set Preferences
                </h3>
                <p className="text-slate-600 text-sm">Define your ideal home</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/app/properties")}
            className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Browse Properties
                </h3>
                <p className="text-slate-600 text-sm">
                  Explore available homes
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/app/shortlist")}
            className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  My Shortlist
                </h3>
                <p className="text-slate-600 text-sm">Saved properties</p>
              </div>
            </div>
          </button>
        </div>

        {/* Recommended Properties Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Recommended For You
              </h2>
            </div>
            <button
              onClick={() => router.push("/app/matches")}
              className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2 transition-colors"
            >
              View All Matches
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>

          {matchedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedProperties.map((match) => (
                <div key={match.property.id} className="relative">
                  <PropertyCard
                    property={match.property}
                    onClick={() => handlePropertyClick(match.property)}
                  />
                  {/* Match Score Badge */}
                  <div className="absolute top-43 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-bold text-green-700 border border-green-200">
                    {Math.round(match.matchScore)}% Match
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No matches yet
              </h3>
              <p className="text-slate-600 mb-6">
                Set your preferences to get personalized property
                recommendations.
              </p>
              <button
                onClick={() => router.push("/app/preferences")}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Set Preferences
              </button>
            </div>
          )}
        </div>

        {/* Featured Properties Section */}
        <FeaturedPropertiesSlider />
      </div>
    </div>
  );
}
