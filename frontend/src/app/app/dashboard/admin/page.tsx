"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import DashboardHeader from "../../../components/DashboardHeader";
import DashboardRouter from "../../../components/DashboardRouter";
import { adminAPI } from "../../../lib/api";
import {
  Shield,
  Users,
  Building2,
  BarChart3,
  UserCheck,
  TrendingUp,
  Activity,
  List,
} from "lucide-react";

function AdminDashboardContent() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalMatches: 0,
    totalShortlists: 0,
    totalFavourites: 0,
    totalPreferences: 0,
    recentUsers: 0,
    recentProperties: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await adminAPI.getStatistics();
        setStatistics(stats);
      } catch (err) {
        console.error("Error fetching admin statistics:", err);
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    if (user && isAuthenticated) {
      fetchStatistics();
    }
  }, [user, isAuthenticated]);

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12">
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-violet-700 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{
                backgroundImage: "url(/key-crown.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    Admin Dashboard
                  </h1>
                  <p className="text-white/90">
                    Welcome back, {user?.full_name || user?.email}! Manage the
                    platform and view different dashboards.
                  </p>
                  <div className="mt-2 text-xs text-white/70">
                    Role: {user?.role || "Not set"} | Status:{" "}
                    {user?.status || "Not set"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">
                  Error Loading Statistics
                </h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              Platform Overview
            </h2>
            <button
              onClick={() => {
                const fetchStatistics = async () => {
                  try {
                    setLoading(true);
                    setError(null);
                    const stats = await adminAPI.getStatistics();
                    setStatistics(stats);
                  } catch (err) {
                    console.error("Error fetching admin statistics:", err);
                    setError("Failed to load statistics");
                  } finally {
                    setLoading(false);
                  }
                };
                fetchStatistics();
              }}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                loading
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Activity
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Total Users</h3>
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-900 mb-1">
                    {statistics.totalUsers}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-600">Registered users</p>
                    {statistics.recentUsers > 0 && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs">
                          +{statistics.recentUsers} this month
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Properties</h3>
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-900 mb-1">
                    {statistics.totalProperties}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-600">Listed properties</p>
                    {statistics.recentProperties > 0 && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs">
                          +{statistics.recentProperties} this month
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <List className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Shortlists</h3>
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-900 mb-1">
                    {statistics.totalShortlists}
                  </p>
                  <p className="text-sm text-slate-600">
                    Total shortlisted properties
                  </p>
                </>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Preferences</h3>
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-900 mb-1">
                    {statistics.totalPreferences}
                  </p>
                  <p className="text-sm text-slate-600">User preferences set</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Recent Activity (Last 30 Days)
              </h2>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 animate-pulse"
                  >
                    <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          New Users
                        </h3>
                        <p className="text-sm text-slate-600">This month</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {statistics.recentUsers}
                    </p>
                    <p className="text-sm text-slate-600">
                      {statistics.recentUsers === 0
                        ? "No new users this month"
                        : `${statistics.recentUsers} new ${
                            statistics.recentUsers === 1 ? "user" : "users"
                          } joined`}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          New Properties
                        </h3>
                        <p className="text-sm text-slate-600">This month</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {statistics.recentProperties}
                    </p>
                    <p className="text-sm text-slate-600">
                      {statistics.recentProperties === 0
                        ? "No new properties this month"
                        : `${statistics.recentProperties} new ${
                            statistics.recentProperties === 1
                              ? "property"
                              : "properties"
                          } listed`}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Platform Health
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-800">
                        System Online
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800">
                        API Responsive
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg">
                      <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                      <span className="text-sm font-medium text-violet-800">
                        Database Connected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardRouter requiredRole="admin">
      <AdminDashboardContent />
    </DashboardRouter>
  );
}
