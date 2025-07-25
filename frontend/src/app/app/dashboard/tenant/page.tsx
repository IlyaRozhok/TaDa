"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Property } from "../../../types";
import {
  useProperties,
  useMatchedProperties,
} from "../../../hooks/useProperties";
import { selectUser } from "../../../store/slices/authSlice";
import MatchedPropertyGridWithLoader from "../../../components/MatchedPropertyGridWithLoader";
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
} from "lucide-react";
import { waitForSessionManager } from "../../../components/providers/SessionManager";
import SimpleDashboardRouter from "../../../components/SimpleDashboardRouter";

function TenantDashboardContent() {
  const user = useSelector(selectUser);
  const router = useRouter();

  // Use consolidated hooks for data fetching
  const {
    properties,
    loading: propertiesLoading,
    error: propertiesError,
    fetchProperties,
  } = useProperties();

  const {
    matchedProperties,
    loading: matchedLoading,
    error: matchedError,
    fetchMatchedProperties,
  } = useMatchedProperties();

  // Combined loading and error states
  const loading = propertiesLoading || matchedLoading;
  const error = propertiesError || matchedError;

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await waitForSessionManager();
        await Promise.all([
          fetchProperties(),
          fetchMatchedProperties(3), // Limit to 3 matches for dashboard
        ]);
      } catch (err) {
        console.error("Dashboard initialization error:", err);
      }
    };

    initializeDashboard();
  }, [fetchProperties, fetchMatchedProperties]);

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
          <div className="relative overflow-hidden bg-gradient-to-r from-[#000428] to-[#004e92] rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{
                backgroundColor: "black",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-white">
                    Welcome back,{" "}
                    {user?.full_name ? user.full_name.split(" ")[0] : "User"}!
                  </h1>
                  <p className="text-sm sm:text-base text-white/90">
                    Your personalized property dashboard awaits
                  </p>
                </div>
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

          <MatchedPropertyGridWithLoader
            matchedProperties={matchedProperties}
            loading={matchedLoading}
            onPropertyClick={handlePropertyClick}
            skeletonCount={3}
          />
          
          {!matchedLoading && matchedProperties.length === 0 && (
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

export default function TenantDashboard() {
  return (
    <SimpleDashboardRouter requiredRole="tenant">
      <TenantDashboardContent />
    </SimpleDashboardRouter>
  );
}
