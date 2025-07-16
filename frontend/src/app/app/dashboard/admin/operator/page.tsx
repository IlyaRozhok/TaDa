"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../../store/slices/authSlice";
import {
  clearErrors,
  TenantRow,
  OperatorProperty,
} from "../../../../store/slices/operatorSlice";
import DashboardHeader from "../../../../components/DashboardHeader";
import {
  Plus,
  Building2,
  Users,
  Eye,
  BarChart3,
  X,
  Send,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { AppDispatch } from "../../../../store/store";
import toast from "react-hot-toast";
import { useOperatorDashboard } from "../../../../components/hooks/useOperatorDashboard";
import { useSuggestProperty } from "../../../../components/hooks/useSuggestProperty";

// Suggest Property Modal Component
const SuggestPropertyModal = memo(function SuggestPropertyModal({
  isOpen,
  onClose,
  tenant,
  properties,
  onSuggest,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  tenant: TenantRow | null;
  properties: OperatorProperty[];
  onSuggest: (propertyId: string) => void;
  isLoading: boolean;
}) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPropertyId) {
      onSuggest(selectedPropertyId);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Suggest Property to {tenant.full_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Tenant:</p>
          <p className="font-medium">{tenant.full_name}</p>
          <p className="text-sm text-gray-600">{tenant.email}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Property
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a property...</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title} - £{property.price.toLocaleString()} (
                  {property.bedrooms} bed, {property.bathrooms} bath)
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedPropertyId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Suggesting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Suggest Property
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

function AdminOperatorDashboard() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Используем оптимизированные хуки
  const operatorState = useOperatorDashboard();
  const {
    showSuggestModal,
    selectedTenant,
    handleSuggestProperty,
    handleSuggestSubmit,
    handleCloseSuggestModal,
  } = useSuggestProperty();

  // Show errors
  useEffect(() => {
    if (operatorState.error) {
      console.error("Operator dashboard error:", operatorState.error);
      toast.error(`Dashboard error: ${operatorState.error}`);
      dispatch(clearErrors());
    }
  }, [operatorState.error, dispatch]);

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
        {/* Admin Notice */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Admin View: Operator Dashboard</span>
          </div>
          <p className="text-amber-700 text-sm mt-1">
            You are viewing the platform as an operator would see it
          </p>
        </div>

        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12 ">
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-600 to-violet-600 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
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
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    Welcome back, Operator!
                  </h1>
                  <p className="text-white/90">
                    Manage your property portfolio and connect with quality
                    tenants
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 text-left cursor-not-allowed opacity-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-500 mb-1">
                  Add Property
                </h3>
                <p className="text-slate-400 text-sm">Admin view only</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 text-left cursor-not-allowed opacity-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-500 mb-1">
                  Manage Properties
                </h3>
                <p className="text-slate-400 text-sm">Admin view only</p>
              </div>
            </div>
          </div>

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
            {useMemo(
              () => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900">
                        Properties
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {operatorState.dashboardCounts?.propertiesCount ?? 0}
                    </p>
                    <p className="text-sm text-slate-600">Active listings</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900">
                        Interested Tenants
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {operatorState.dashboardCounts?.tenantsCount ?? 0}
                    </p>
                    <p className="text-sm text-slate-600">
                      Who shortlisted your properties
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-violet-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900">Matches</h3>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {operatorState.dashboardCounts?.matchesCount ?? 0}
                    </p>
                    <p className="text-sm text-slate-600">
                      Based on preferences
                    </p>
                  </div>
                </div>
              ),
              [operatorState.dashboardCounts]
            )}

            {/* Tenants Overview */}
            {useMemo(
              () => (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Interested Tenants
                  </h3>
                  <div className="bg-slate-50 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-900">
                              Tenant
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-900">
                              Preferences
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-900">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {operatorState.tenants.map((tenant) => (
                            <tr
                              key={tenant.id}
                              className="border-b border-slate-200 hover:bg-white/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                    {tenant.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {tenant.full_name}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                      {tenant.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-600">
                                  {tenant.preferences ? (
                                    <div className="space-y-1">
                                      {tenant.preferences.min_price &&
                                        tenant.preferences.max_price && (
                                          <div>
                                            Budget: £
                                            {tenant.preferences.min_price.toLocaleString()}{" "}
                                            - £
                                            {tenant.preferences.max_price.toLocaleString()}
                                          </div>
                                        )}
                                      {tenant.preferences.min_bedrooms && (
                                        <div>
                                          Bedrooms:{" "}
                                          {tenant.preferences.min_bedrooms}
                                          {tenant.preferences.max_bedrooms &&
                                          tenant.preferences.max_bedrooms !==
                                            tenant.preferences.min_bedrooms
                                            ? `-${tenant.preferences.max_bedrooms}`
                                            : "+"}
                                        </div>
                                      )}
                                      {tenant.preferences.property_type && (
                                        <div className="capitalize">
                                          Type:{" "}
                                          {tenant.preferences.property_type}
                                        </div>
                                      )}
                                      {tenant.preferences.primary_postcode && (
                                        <div>
                                          Location:{" "}
                                          {tenant.preferences.primary_postcode}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">
                                      No preferences set
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleSuggestProperty(tenant)}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                  Suggest Property
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ),
              [operatorState.tenants, handleSuggestProperty]
            )}

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

        {/* Suggest Property Modal */}
        <SuggestPropertyModal
          isOpen={showSuggestModal}
          onClose={handleCloseSuggestModal}
          tenant={selectedTenant}
          properties={operatorState.properties}
          onSuggest={handleSuggestSubmit}
          isLoading={operatorState.suggestingProperty}
        />
      </div>
    </div>
  );
}

export default AdminOperatorDashboard;
