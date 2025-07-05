"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import DashboardHeader from "../../../components/DashboardHeader";
import { Plus, Building2, Users, Eye, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function OperatorDashboard() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/app/auth/login");
      return;
    }

    if (!user.is_operator) {
      router.push("/app/dashboard/tenant");
      return;
    }
  }, [isAuthenticated, user, router]);

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading dashboard...</p>
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
        <div className="mb-8 sm:mb-12 ">
          <div className="bg-gradient-to-r from-slate-600 to-violet-600 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Welcome back,{" "}
                  {user?.full_name ? user.full_name.split(" ")[0] : "User"}!
                </h1>
                <p className="text-white">
                  Manage your property portfolio and connect with quality
                  tenants
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/app/properties/create">
            <div className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Plus className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    Add Property
                  </h3>
                  <p className="text-slate-600 text-sm">List a new property</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/app/properties/manage">
            <div className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    Manage Properties
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Edit & view your listings
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/app/properties">
            <div className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                  <Users className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    Browse All Properties
                  </h3>
                  <p className="text-slate-600 text-sm">
                    View marketplace listings
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Portfolio Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Portfolio Overview
              </h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Properties</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">0</p>
                <p className="text-sm text-slate-600">Active listings</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Tenants</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">1</p>
                <p className="text-sm text-slate-600">Active tenancies</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Matches</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">0</p>
                <p className="text-sm text-slate-600">This month</p>
              </div>
            </div>

            {/* Getting Started */}
            <div className="text-center py-12 border-t border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Ready to get started?
              </h3>
              <p className="text-slate-600 max-w-md mx-auto mb-6">
                Add your first property to start connecting with quality tenants
                and growing your portfolio.
              </p>
              <Link href="/app/properties/create">
                <button className="bg-slate-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors">
                  Add Your First Property
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
