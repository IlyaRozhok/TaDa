"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  matchingAPI,
  DetailedMatchingResult,
  Property,
  preferencesAPI,
} from "../../lib/api";
import { selectUser } from "../../store/slices/authSlice";
import MatchedPropertyGridWithLoader from "../../components/MatchedPropertyGridWithLoader";
import DashboardHeader from "../../components/DashboardHeader";
import { useRouter } from "next/navigation";
import {
  Target,
  ArrowLeft,
  Sparkles,
  Grid3X3,
  List,
  Filter,
  TrendingUp,
  Home,
  Heart,
  Settings,
} from "lucide-react";
import { waitForSessionManager } from "../../components/providers/SessionManager";

export default function MatchesPage() {
  const router = useRouter();
  const user = useSelector(selectUser);
  const [detailedMatches, setDetailedMatches] = useState<
    DetailedMatchingResult[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "detailed">("detailed");
  const [sortBy, setSortBy] = useState<"score" | "price" | "date">("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Wait for session manager initialization before making API calls
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log("🔐 Matches: Waiting for session manager...");
        await waitForSessionManager();
        console.log(
          "✅ Matches: Session manager ready, proceeding with data fetch"
        );
        setSessionLoading(false);
      } catch (error) {
        console.error(
          "❌ Matches: Session manager initialization failed:",
          error
        );
        setSessionLoading(false);
      }
    };

    initializeSession();
  }, []);

  useEffect(() => {
    // Only fetch matches after session manager is ready
    if (sessionLoading) {
      return;
    }

    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("📡 Matches: Fetching detailed matches...");
        const response = await matchingAPI.getDetailedMatches(20);

        // Extract data from axios response
        const matches = response?.data || response;
        console.log("🔍 Raw matches response:", {
          hasResponse: !!response,
          hasData: !!response?.data,
          matchesCount: Array.isArray(matches) ? matches.length : 0,
        });

        // Ensure matches is always an array
        const matchesArray = Array.isArray(matches) ? matches : [];
        setDetailedMatches(matchesArray);
        console.log(
          "✅ Matches: Detailed matches loaded:",
          matchesArray.length
        );
      } catch (err) {
        console.error("❌ Matches: Error fetching matches:", err);
        setError("Failed to load property matches");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [sessionLoading]);

  // Sort matches with robust handling
  const sortedMatches = useMemo(() => {
    console.log("🔄 Sorting matches by:", sortBy, "direction:", sortDirection);

    // Ensure detailedMatches is an array before sorting
    if (!Array.isArray(detailedMatches) || detailedMatches.length === 0) {
      console.log(
        "⚠️ detailedMatches is not an array or is empty:",
        detailedMatches
      );
      return [];
    }

    const sorted = [...detailedMatches].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "score":
          // Compare match scores
          const scoreA = a.matchScore || 0;
          const scoreB = b.matchScore || 0;
          comparison = scoreB - scoreA; // Default: highest first
          break;

        case "price":
          // Compare prices
          const priceA = a.property.price || 0;
          const priceB = b.property.price || 0;
          comparison = priceA - priceB; // Default: lowest first
          break;

        case "date":
          // Compare dates
          const dateA = new Date(a.property.created_at || 0).getTime();
          const dateB = new Date(b.property.created_at || 0).getTime();
          comparison = dateB - dateA; // Default: newest first
          break;

        default:
          return 0;
      }

      // Apply sort direction
      return sortDirection === "desc" ? comparison : -comparison;
    });
    console.log("✅ Sorted matches:", sorted.length, "properties");
    return sorted;
  }, [detailedMatches, sortBy, sortDirection]);

  const handlePropertyClick = (property: Property) => {
    router.push(`/app/properties/${property.id}`);
  };

  // Match score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return "★";
    if (score >= 60) return "✓";
    if (score >= 40) return "○";
    return "·";
  };

  // Loading skeleton
  const MatchSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-64 bg-gray-200"></div>
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        </div>
      </div>
    </div>
  );

  // Show loading state while session manager is initializing or matches are loading
  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <MatchSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <Target className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error Loading Matches
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/app/dashboard/tenant")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Target className="w-8 h-8 text-green-600" />
                Your Property Matches
              </h1>
              <p className="text-gray-600">
                Properties tailored to your preferences • {sortedMatches.length}{" "}
                matches found
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {sortBy === "score" &&
                    `🏆 Best Match ${
                      sortDirection === "desc" ? "First" : "Last"
                    }`}
                  {sortBy === "price" &&
                    `💰 Price: ${
                      sortDirection === "desc" ? "High to Low" : "Low to High"
                    }`}
                  {sortBy === "date" &&
                    `📅 ${
                      sortDirection === "desc" ? "Newest" : "Oldest"
                    } First`}
                </span>
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-gray-200 bg-white">
                <button
                  onClick={() => setViewMode("detailed")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                    viewMode === "detailed"
                      ? "bg-green-100 text-green-800"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                  Detailed
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-green-100 text-green-800"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  Grid
                </button>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      const newSortBy = e.target.value as
                        | "score"
                        | "price"
                        | "date";
                      console.log("🔄 User changed sorting to:", newSortBy);
                      setSortBy(newSortBy);
                      // Reset direction to default for each sort type
                      setSortDirection("desc");
                    }}
                    className="px-4 py-2 pr-10 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <option value="score">🏆 Match Score</option>
                    <option value="price">💰 Price</option>
                    <option value="date">📅 Date Added</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Sort Direction Toggle */}
                <button
                  onClick={() => {
                    const newDirection =
                      sortDirection === "desc" ? "asc" : "desc";
                    console.log(
                      "🔄 User toggled sort direction to:",
                      newDirection
                    );
                    setSortDirection(newDirection);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
                  title={`Sort ${
                    sortDirection === "desc" ? "ascending" : "descending"
                  }`}
                >
                  {sortDirection === "desc" ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Update Preferences Button */}
              <button
                onClick={() => router.push("/app/preferences")}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-400 transition-colors text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                Update Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Matches Display */}
        {sortedMatches.length > 0 ? (
          <>
            {viewMode === "detailed" ? (
              // Detailed View with Match Information
              <div className="space-y-6">
                {sortedMatches.map((matchResult, index) => (
                  <div
                    key={matchResult.property.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                      {/* Property Image */}
                      <div className="lg:col-span-1">
                        <div className="relative h-64 lg:h-full min-h-[200px] bg-gray-200 rounded-lg overflow-hidden">
                          {(() => {
                            // Get first image from media or fallback to images array
                            let imageUrl = "";

                            if (
                              matchResult.property.media &&
                              matchResult.property.media.length > 0
                            ) {
                              const featuredImage =
                                matchResult.property.media.find(
                                  (item) => item.type === "image"
                                );
                              if (featuredImage) {
                                imageUrl = featuredImage.url;
                              } else {
                                const firstImage = matchResult.property.media
                                  .filter((item) => item.type === "image")
                                  .sort(
                                    (a, b) => a.order_index - b.order_index
                                  )[0];
                                if (firstImage) {
                                  imageUrl = firstImage.url;
                                }
                              }
                            } else if (
                              matchResult.property.images &&
                              matchResult.property.images.length > 0
                            ) {
                              imageUrl = matchResult.property.images[0];
                            }

                            if (imageUrl) {
                              return (
                                <img
                                  src={imageUrl}
                                  alt={matchResult.property.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RDdEQSIvPgo8L3N2Zz4K";
                                  }}
                                />
                              );
                            } else {
                              return (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Home className="w-12 h-12 text-gray-400" />
                                </div>
                              );
                            }
                          })()}

                          {/* Match Rank Badge */}
                          <div className="absolute top-3 left-3">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-bold text-gray-800">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="lg:col-span-1 space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {matchResult.property.title}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {matchResult.property.description}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="font-medium">
                              £
                              {matchResult.property.price?.toLocaleString(
                                "en-GB"
                              ) || "N/A"}
                              /month
                            </span>
                            <span>•</span>
                            <span>{matchResult.property.bedrooms} bed</span>
                            <span>•</span>
                            <span>{matchResult.property.bathrooms} bath</span>
                          </div>

                          <div className="text-sm text-gray-500">
                            📍 {matchResult.property.address}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {matchResult.property.property_type}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              {matchResult.property.furnishing}
                            </span>
                            {matchResult.property.is_btr && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                BTR
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handlePropertyClick(matchResult.property)
                          }
                          className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                        >
                          View Details
                        </button>
                      </div>

                      {/* Match Information */}
                      <div className="lg:col-span-1 space-y-4">
                        {/* Match Score */}
                        <div
                          className={`p-4 rounded-lg border ${getScoreColor(
                            matchResult.matchScore
                          )}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">
                              {getScoreEmoji(matchResult.matchScore)}
                            </span>
                            <span className="font-bold text-lg">
                              {matchResult.matchScore}% Match
                            </span>
                          </div>
                          <div className="w-full bg-white/50 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-current opacity-60"
                              style={{ width: `${matchResult.matchScore}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Match Reasons */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            Why this matches
                          </h4>
                          <ul className="space-y-2">
                            {matchResult.matchReasons.map(
                              (reason, reasonIndex) => (
                                <li
                                  key={reasonIndex}
                                  className="flex items-start gap-2 text-sm text-gray-700"
                                >
                                  <span className="text-green-500 mt-0.5 flex-shrink-0">
                                    ✓
                                  </span>
                                  <span>{reason}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Grid View
              <MatchedPropertyGridWithLoader
                matchedProperties={sortedMatches}
                loading={loading}
                onPropertyClick={handlePropertyClick}
                userPreferences={userPreferences}
              />
            )}

            {/* Load More Button */}
            {sortedMatches.length >= 20 && (
              <div className="text-center mt-12">
                <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                  Load More Matches
                </button>
              </div>
            )}
          </>
        ) : (
          // No Matches State
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-gray-400 mb-6">
              <Target className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No matches found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We couldn&apos;t find properties that match your current
              preferences. Try adjusting your criteria to see more options.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/app/preferences")}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Update Preferences
              </button>
              <button
                onClick={() => router.push("/app/properties")}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Browse All Properties
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
