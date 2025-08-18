"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Property } from "../../../types";
import { propertiesAPI, preferencesAPI, matchingAPI } from "../../../lib/api";
import { selectUser } from "../../../store/slices/authSlice";
import { useDebounce } from "../../../hooks/useDebounce";
import { waitForSessionManager } from "../../../components/providers/SessionManager";
import TenantDashboardHeader from "../../../components/TenantDashboardHeader";
import TenantPerfectMatchSection from "../../../components/TenantPerfectMatchSection";
import ListedPropertiesSection from "../../../components/ListedPropertiesSection";

function TenantDashboardContent() {
  const user = useSelector(selectUser);

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [matchedProperties, setMatchedProperties] = useState<
    Array<{ property: Property; matchScore: number }>
  >([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [preferencesCount, setPreferencesCount] = useState(0);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [hasCompletePreferences, setHasCompletePreferences] = useState(false);

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setSessionLoading(true);
        await waitForSessionManager();

        // Load user preferences
        try {
          const preferencesResponse = await preferencesAPI.get();
          setUserPreferences(preferencesResponse.data);

          // Count filled preferences (rough estimate)
          const prefs = preferencesResponse.data;
          let count = 0;
          let requiredFieldsCount = 0;

          // Required fields for "complete" status
          if (prefs?.min_price && prefs?.max_price) {
            count++;
            requiredFieldsCount++;
          }
          if (prefs?.min_bedrooms) {
            count++;
            requiredFieldsCount++;
          }
          if (prefs?.property_type?.length > 0) count++;
          if (prefs?.lifestyle_features?.length > 0) count++;
          if (prefs?.primary_postcode) {
            count++;
            requiredFieldsCount++;
          }

          setPreferencesCount(count);

          // Check if all required fields are filled (min 3 required fields)
          const isComplete = requiredFieldsCount >= 3;
          setHasCompletePreferences(isComplete);

          console.log("✅ User preferences loaded:", preferencesResponse.data);
        } catch (error) {
          console.error("❌ Failed to load preferences:", error);
        }

        // Load matched properties (only if user has preferences)
        try {
          if (userPreferences && preferencesCount > 0) {
            const matchingResponse = await matchingAPI.getMatches();
            setMatchedProperties(matchingResponse.data || []);
            console.log("✅ Matched properties loaded:", matchingResponse.data);
          } else {
            setMatchedProperties([]);
          }
        } catch (error) {
          console.error("❌ Failed to load matched properties:", error);
          // Don't fail the whole dashboard if matching fails
          setMatchedProperties([]);
        }

        // Load all properties initially (always, regardless of preferences)
        console.log("🏠 Loading initial properties...");
        await loadProperties("");

        console.log("📊 Dashboard initialization complete:", {
          hasPreferences: !!userPreferences,
          preferencesCount,
          propertiesCount: properties.length,
          matchedPropertiesCount: matchedProperties.length,
          propertiesState: properties,
          propertiesType: typeof properties,
          isArray: Array.isArray(properties),
        });
      } catch (error) {
        console.error("❌ Failed to initialize dashboard:", error);
        setError("Failed to load dashboard data");
      } finally {
        setSessionLoading(false);
      }
    };

    if (user?.role === "tenant") {
      initializeDashboard();
    }
  }, [user]);

  // Load properties with search
  const loadProperties = async (search: string) => {
    try {
      setLoading(true);
      setError(null);

      // Try to load properties with search
      let response;
      try {
        response = await propertiesAPI.getPublic(1, 50, search);
      } catch (searchError) {
        console.warn("⚠️ Search failed, trying to load all properties...");
        // Fallback: load all properties without search
        response = await propertiesAPI.getPublic(1, 50);
      }

      // Extract properties from response - API returns {data: [...], total: number, ...}
      const propertiesData = response.data?.data || response.data || [];
      const totalCount = response.data?.total || propertiesData.length;

      setProperties(propertiesData);
      setTotalCount(totalCount);

      console.log("✅ Properties loaded:", {
        count: propertiesData.length,
        totalCount,
        searchTerm: search,
        hasData: propertiesData.length > 0,
        responseStructure: {
          hasData: !!response.data,
          hasDataData: !!response.data?.data,
          responseDataType: typeof response.data,
          dataDataType: typeof response.data?.data,
        },
      });

      // If no properties found, try to load featured properties as fallback
      if (propertiesData.length === 0 && !search) {
        console.log(
          "🔄 No properties found, loading featured properties as fallback..."
        );
        try {
          const featuredResponse = await propertiesAPI.getFeatured();
          // Extract featured properties data
          const featuredData =
            featuredResponse.data?.data || featuredResponse.data || [];
          if (featuredData.length > 0) {
            setProperties(featuredData);
            setTotalCount(featuredData.length);
            console.log(
              "✅ Featured properties loaded as fallback:",
              featuredData.length
            );
          } else {
            console.warn("⚠️ No featured properties available either");
            // Try to load any properties without filters
            try {
              const allResponse = await propertiesAPI.getAll();
              // Extract all properties data
              const allData = allResponse.data?.data || allResponse.data || [];
              if (allData.length > 0) {
                setProperties(allData);
                setTotalCount(allData.length);
                console.log(
                  "✅ All properties loaded as final fallback:",
                  allData.length
                );
              }
            } catch (allError) {
              console.warn("⚠️ All properties fallback also failed");
            }
          }
        } catch (featuredError) {
          console.warn("⚠️ Featured properties fallback also failed");
        }
      }
    } catch (error: any) {
      console.error("❌ Failed to load properties:", error);
      setError("Failed to load properties");
      setProperties([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load properties when search term changes
  useEffect(() => {
    if (user?.role === "tenant" && !sessionLoading) {
      loadProperties(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, user, sessionLoading]);

  // Loading state
  if (!user || sessionLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <TenantDashboardHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        preferencesCount={preferencesCount}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Perfect Match Section - only show if preferences are NOT complete */}
        {!hasCompletePreferences && (
          <TenantPerfectMatchSection
            hasPreferences={!!userPreferences && preferencesCount > 0}
            preferencesCount={preferencesCount}
          />
        )}

        {/* Listed Properties Section */}
        <ListedPropertiesSection
          properties={properties}
          matchedProperties={matchedProperties}
          loading={loading}
          userPreferences={userPreferences}
          totalCount={totalCount}
        />
      </main>
    </div>
  );
}

export default function TenantDashboardPage() {
  const user = useSelector(selectUser);

  // Redirect non-tenants
  if (user && user.role !== "tenant") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            This page is only accessible to tenant users.
          </p>
        </div>
      </div>
    );
  }

  return <TenantDashboardContent />;
}
