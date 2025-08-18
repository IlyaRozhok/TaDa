"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  propertiesAPI,
  matchingAPI,
  shortlistAPI,
  authAPI,
  preferencesAPI,
  PreferencesData,
} from "../../lib/api";
import { selectUser } from "../../store/slices/authSlice";
import DashboardHeader from "../../components/DashboardHeader";
import {
  Home,
  Search,
  TrendingUp,
  Target,
  Heart,
  User,
  Settings,
  Edit,
  ArrowRight,
  MapPin,
  PoundSterling,
  Calendar,
  Briefcase,
  Phone,
  Mail,
  Clock,
  Car,
  Building,
  Sparkles,
  PawPrint,
  Coffee,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { waitForSessionManager } from "../../components/providers/SessionManager";

interface ExtendedUser {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  age_range?: string;
  occupation?: string;
  industry?: string;
  work_style?: string;
  lifestyle?: string;
  pets?: string;
  smoker?: boolean;
  hobbies?: string;
  ideal_living_environment?: string;
  additional_info?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfileSummaryPage() {
  const router = useRouter();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullUserData, setFullUserData] = useState<ExtendedUser | null>(null);
  const [preferences, setPreferences] = useState<PreferencesData | null>(null);
  const [stats, setStats] = useState({
    totalProperties: 0,
    perfectMatches: 0,
    shortlisted: 0,
  });

  // Wait for session manager initialization
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // console.log("🔐 Profile Summary: Waiting for session manager...");
        await waitForSessionManager();
        // console.log("✅ Profile Summary: Session manager ready");
        setSessionLoading(false);
      } catch (error) {
        console.error(
          "❌ Profile Summary: Session manager initialization failed:",
          error
        );
        setSessionLoading(false);
      }
    };

    initializeSession();
  }, []);

  useEffect(() => {
    if (sessionLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [
          userProfile,
          userPreferences,
          properties,
          matches,
          shortlistCount,
        ] = await Promise.allSettled([
          usersAPI.getMe(),
          preferencesAPI.get(),
          propertiesAPI.getFeatured(100),
          matchingAPI.getMatches(100),
          shortlistAPI.getCount(),
        ]);

        // Set user data
        if (userProfile.status === "fulfilled") {
          setFullUserData(userProfile.value);
        }

        // Set preferences
        if (userPreferences.status === "fulfilled") {
          setPreferences(userPreferences.value?.data || null);
        }

        // Set stats
        setStats({
          totalProperties:
            properties.status === "fulfilled" ? properties.value.length : 0,
          perfectMatches:
            matches.status === "fulfilled" ? matches.value.length : 0,
          shortlisted:
            shortlistCount.status === "fulfilled" ? shortlistCount.value : 0,
        });

        // console.log("✅ Profile Summary: All data loaded successfully");
      } catch (err) {
        console.error("❌ Profile Summary: Error fetching data:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionLoading]);

  const StatCard = ({
    icon: Icon,
    value,
    label,
    color,
    isLoading,
  }: {
    icon: any;
    value: number;
    label: string;
    color: string;
    isLoading: boolean;
  }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-12"></div>
          </div>
        ) : (
          <div className="text-3xl font-bold text-black">{value}</div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-black mb-1">{label}</h3>
      <p className="text-sm text-black">
        {isLoading ? "Loading..." : "Updated just now"}
      </p>
    </div>
  );

  const InfoRow = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: string | undefined | null;
    icon?: any;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
      {Icon && (
        <div className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-black mb-1">{label}</div>
        <div className="text-sm text-black break-words">
          {value || <span className="text-gray-400 italic">Not provided</span>}
        </div>
      </div>
    </div>
  );

  const SectionCard = ({
    title,
    icon: Icon,
    children,
    className = "",
  }: {
    title: string;
    icon: any;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-black">{title}</h2>
      </div>
      {children}
    </div>
  );

  const FeatureList = ({
    features,
    category,
  }: {
    features: string[];
    category: string;
  }) => {
    if (!features || features.length === 0) {
      return (
        <div className="text-sm text-gray-400 italic">
          No {category.toLowerCase()} features selected
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {features.map((feature, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm font-medium"
          >
            {feature
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </span>
        ))}
      </div>
    );
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <DashboardHeader />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-black font-medium">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <DashboardHeader />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <div className="text-red-600 mb-4">
              <AlertCircle className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error Loading Profile
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-600 to-violet-600 text-white p-8 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back, {user?.full_name?.split(" ")[0] || "User"}!
                </h1>
                <p className="text-lg text-blue-100">
                  Here's your complete TaDa profile overview
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Home}
            value={stats.totalProperties}
            label="Available Properties"
            color="bg-blue-500"
            isLoading={false}
          />
          <StatCard
            icon={Target}
            value={stats.perfectMatches}
            label="Perfect Matches"
            color="bg-green-500"
            isLoading={false}
          />
          <StatCard
            icon={Heart}
            value={stats.shortlisted}
            label="Shortlisted Properties"
            color="bg-red-500"
            isLoading={false}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Information */}
          <div className="space-y-6">
            <SectionCard title="Personal Information" icon={User}>
              <div className="space-y-0">
                <InfoRow
                  label="Full Name"
                  value={fullUserData?.full_name}
                  icon={User}
                />
                <InfoRow
                  label="Email Address"
                  value={fullUserData?.email}
                  icon={Mail}
                />
                <InfoRow
                  label="Account Type"
                  value={
                    fullUserData?.roles?.includes("operator")
                      ? "Property Operator"
                      : "Tenant"
                  }
                  icon={Settings}
                />
                <InfoRow
                  label="Age Range"
                  value={fullUserData?.age_range}
                  icon={Calendar}
                />
                <InfoRow
                  label="Occupation"
                  value={fullUserData?.occupation}
                  icon={Briefcase}
                />
                <InfoRow
                  label="Industry"
                  value={fullUserData?.industry}
                  icon={Building}
                />
                <InfoRow
                  label="Work Style"
                  value={fullUserData?.work_style}
                  icon={Coffee}
                />
              </div>
            </SectionCard>

            <SectionCard title="Lifestyle & Preferences" icon={Sparkles}>
              <div className="space-y-0">
                <InfoRow
                  label="Lifestyle"
                  value={fullUserData?.lifestyle}
                  icon={Home}
                />
                <InfoRow
                  label="Pets"
                  value={preferences?.pets}
                  icon={PawPrint}
                />
                <InfoRow
                  label="Smoker"
                  value={preferences?.smoker ? "Yes" : "No"}
                  icon={Info}
                />
                <InfoRow
                  label="Ideal Living Environment"
                  value={preferences?.ideal_living_environment}
                  icon={Home}
                />
                <InfoRow
                  label="Hobbies"
                  value={
                    Array.isArray(preferences?.hobbies)
                      ? preferences.hobbies.join(", ")
                      : preferences?.hobbies
                  }
                  icon={Sparkles}
                />
              </div>
              {preferences?.additional_info && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm font-semibold text-black mb-2">
                    About Me
                  </div>
                  <div className="text-sm text-black leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {preferences.additional_info}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Preferences Information */}
          <div className="space-y-6">
            {preferences ? (
              <>
                <SectionCard title="Location & Commute" icon={MapPin}>
                  <div className="space-y-0">
                    <InfoRow
                      label="Primary Postcode"
                      value={preferences.primary_postcode}
                      icon={MapPin}
                    />
                    <InfoRow
                      label="Secondary Location"
                      value={preferences.secondary_location}
                      icon={MapPin}
                    />
                    <InfoRow
                      label="Commute Location"
                      value={preferences.commute_location}
                      icon={Building}
                    />
                    <InfoRow
                      label="Move-in Date"
                      value={preferences.move_in_date}
                      icon={Calendar}
                    />
                    <InfoRow
                      label="Max Walking Time"
                      value={
                        preferences.commute_time_walk
                          ? `${preferences.commute_time_walk} minutes`
                          : undefined
                      }
                      icon={Clock}
                    />
                    <InfoRow
                      label="Max Cycling Time"
                      value={
                        preferences.commute_time_cycle
                          ? `${preferences.commute_time_cycle} minutes`
                          : undefined
                      }
                      icon={Car}
                    />
                    <InfoRow
                      label="Max Tube Time"
                      value={
                        preferences.commute_time_tube
                          ? `${preferences.commute_time_tube} minutes`
                          : undefined
                      }
                      icon={Clock}
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Budget & Property Requirements"
                  icon={PoundSterling}
                >
                  <div className="space-y-0">
                    <InfoRow
                      label="Budget Range"
                      value={
                        preferences.min_price && preferences.max_price
                          ? `£${preferences.min_price} - £${preferences.max_price}`
                          : undefined
                      }
                      icon={PoundSterling}
                    />
                    <InfoRow
                      label="Bedrooms"
                      value={
                        preferences.min_bedrooms && preferences.max_bedrooms
                          ? `${preferences.min_bedrooms} - ${preferences.max_bedrooms}`
                          : undefined
                      }
                      icon={Home}
                    />
                    <InfoRow
                      label="Bathrooms"
                      value={
                        preferences.min_bathrooms && preferences.max_bathrooms
                          ? `${preferences.min_bathrooms} - ${preferences.max_bathrooms}`
                          : undefined
                      }
                      icon={Home}
                    />
                    <InfoRow
                      label="Property Type"
                      value={preferences.property_type}
                      icon={Building}
                    />
                    <InfoRow
                      label="Furnishing"
                      value={preferences.furnishing}
                      icon={Home}
                    />
                    <InfoRow
                      label="Let Duration"
                      value={preferences.let_duration}
                      icon={Calendar}
                    />
                    <InfoRow
                      label="House Shares"
                      value={preferences.house_shares}
                      icon={User}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Lifestyle Features" icon={Sparkles}>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-black mb-2">
                        Lifestyle & Wellbeing
                      </div>
                      <FeatureList
                        features={preferences.lifestyle_features || []}
                        category="lifestyle"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-black mb-2">
                        Social & Community
                      </div>
                      <FeatureList
                        features={preferences.social_features || []}
                        category="social"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-black mb-2">
                        Work & Study
                      </div>
                      <FeatureList
                        features={preferences.work_features || []}
                        category="work"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-black mb-2">
                        Convenience
                      </div>
                      <FeatureList
                        features={preferences.convenience_features || []}
                        category="convenience"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-black mb-2">
                        Pet-Friendly
                      </div>
                      <FeatureList
                        features={preferences.pet_friendly_features || []}
                        category="pet-friendly"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-black mb-2">
                        Luxury Features
                      </div>
                      <FeatureList
                        features={preferences.luxury_features || []}
                        category="luxury"
                      />
                    </div>
                  </div>
                </SectionCard>
              </>
            ) : (
              <SectionCard title="Preferences" icon={Settings}>
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-black mb-4">
                    You haven't set your rental preferences yet.
                  </p>
                  <button
                    onClick={() => router.push("/app/preferences")}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Set Preferences
                  </button>
                </div>
              </SectionCard>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/app/properties")}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black mb-1">
                    Browse All Properties
                  </h3>
                  <p className="text-sm text-black">
                    Explore our complete property database
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push("/app/shortlist")}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black mb-1">
                    Manage Shortlist
                  </h3>
                  <p className="text-sm text-black">
                    Review and organize your saved properties
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push("/app/matches")}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black mb-1">
                    View All Matches
                  </h3>
                  <p className="text-sm text-black">
                    See properties that perfectly match your criteria
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => router.push("/app/profile")}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
                  <Edit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black mb-1">
                    Edit Profile Settings
                  </h3>
                  <p className="text-sm text-black">
                    Update your personal information
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push("/app/preferences")}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black mb-1">
                    Update Preferences
                  </h3>
                  <p className="text-sm text-black">
                    Refine your search criteria for better matches
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
