"use client";

import { useState, useEffect } from "react";
// import { useSelector } from "react-redux";
import {
  propertiesAPI,
  // matchingAPI,
  // Property,
  // MatchingResult,
} from "../../../../lib/api";
// import { selectUser } from "../../../../store/slices/authSlice";
// import PropertyCard from "../../../../components/PropertyCard";
import DashboardHeader from "../../../../components/DashboardHeader";
import FeaturedPropertiesSlider from "../../../../components/FeaturedPropertiesSlider";
import { useRouter } from "next/navigation";
import {
  Home,
  Search,
  // TrendingUp,
  Heart,
  Target,
  // Sparkles,
  // User,
  Shield,
} from "lucide-react";
import { waitForSessionManager } from "../../../../components/providers/SessionManager";

function AdminTenantDashboard() {
  // const user = useSelector(selectUser);
  const router = useRouter();
  // const [properties, setProperties] = useState<Property[]>([]);
  // const [matchedProperties, setMatchedProperties] = useState<MatchingResult[]>(
  //   []
  // );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await waitForSessionManager();
        await Promise.all([fetchProperties(), fetchMatchedProperties()]);
      } catch (err) {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      const responseData = response.data || response;
      // Backend returns { data: properties[], total, page, totalPages }
      const propertiesData =
        responseData.data || responseData.properties || responseData || [];
      // setProperties(propertiesData.slice(0, 6));
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  const fetchMatchedProperties = async () => {
    try {
      // const response = await matchingAPI.getDetailedMatches(3);
      // setMatchedProperties(response);
    } catch (err) {
      console.error("Error fetching matched properties:", err);
      // If there's an error with detailed matches, set empty array to show "No matches yet"
      // setMatchedProperties([]);
    }
  };

  // const handlePropertyClick = (property: Property) => {
  //   router.push(`/app/properties/${property.id}`);
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Empty space while loading */}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
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

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Admin Notice */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Admin View: Tenant Dashboard</span>
          </div>
          <p className="text-amber-700 text-sm mt-1">
            You are viewing the platform as a tenant would see it
          </p>
        </div>

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
                    Welcome back, Tenant!
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
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 text-left cursor-not-allowed opacity-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-500 mb-1">
                  Set Preferences
                </h3>
                <p className="text-slate-400 text-sm">Admin view only</p>
              </div>
            </div>
          </div>

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

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 text-left cursor-not-allowed opacity-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-500 mb-1">
                  My Shortlist
                </h3>
                <p className="text-slate-400 text-sm">Admin view only</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Properties Section */}

        {/* Featured Properties Section */}
        <FeaturedPropertiesSlider />
      </div>
    </div>
  );
}

export default AdminTenantDashboard;
