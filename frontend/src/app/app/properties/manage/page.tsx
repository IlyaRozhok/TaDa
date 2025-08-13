"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import DashboardHeader from "../../../components/DashboardHeader";
import { getUserRole } from "../../../utils/simpleRedirect";
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Users,
  Heart,
  Calendar,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Building2,
} from "lucide-react";

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnishing: string;
  lifestyle_features: string[];
  available_from: string;
  images: string[];
  is_btr: boolean;
  operator_id: string;
  created_at: string;
  updated_at: string;
  media?: Array<{
    id: string;
    type: string;
    url: string;
    is_featured: boolean;
    order_index: number;
  }>;
}

interface InterestedTenant {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    created_at: string;
  };
  interactions: {
    favourited: boolean;
    favourited_at: string | null;
    shortlisted: boolean;
    shortlisted_at: string | null;
  };
}

export default function ManagePropertiesPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [interestedTenants, setInterestedTenants] = useState<
    InterestedTenant[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTenantModal, setShowTenantModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/");
      return;
    }

    // Check if user is operator using the proper role system
    const userRole = getUserRole(user);
    if (userRole !== "operator" && userRole !== "admin") {
      router.push("/app/dashboard/tenant");
      return;
    }

    fetchProperties();
  }, [isAuthenticated, user, router]);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const response = await fetch(`${apiUrl}/properties/my-properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }

      const data = await response.json();
      setProperties(data);
    } catch (err: any) {
      setError(err.message || "Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInterestedTenants = async (propertyId: string) => {
    try {
      setIsLoadingTenants(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const response = await fetch(
        `${apiUrl}/properties/${propertyId}/interested-tenants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch interested tenants");
      }

      const data = await response.json();
      setInterestedTenants(data.interested_tenants || []);
    } catch (err: any) {
      console.error("Error fetching interested tenants:", err);
      setInterestedTenants([]);
    } finally {
      setIsLoadingTenants(false);
    }
  };

  const handleViewTenants = async (property: Property) => {
    setSelectedProperty(property);
    setShowTenantModal(true);
    await fetchInterestedTenants(property.id);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this property? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const response = await fetch(`${apiUrl}/properties/${propertyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete property");
      }

      // Refresh properties list
      await fetchProperties();
    } catch (err: any) {
      alert(err.message || "Failed to delete property");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-UK");
  };

  const formatPrice = (price: number) => {
    return `£${price.toLocaleString()}`;
  };

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/app/dashboard/operator")}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-6 font-medium group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-1">
                    Manage Properties
                  </h1>
                  <p className="text-slate-600">
                    View and manage your property portfolio ({properties.length}{" "}
                    properties)
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/app/properties/create")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Property
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading your properties...</p>
            </div>
          </div>
        ) : properties.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              No properties yet
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Start building your property portfolio by adding your first
              property listing.
            </p>
            <button
              onClick={() => router.push("/app/properties/create")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add Your First Property
            </button>
          </div>
        ) : (
          /* Properties Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Property Image */}
                <div className="h-48 bg-slate-100 relative">
                  {(() => {
                    // Get first image from media or fallback to images array
                    let imageUrl = "";

                    if (property.media && property.media.length > 0) {
                      const featuredImage = property.media.find(
                        (item) => item.is_featured && item.type === "image"
                      );
                      if (featuredImage) {
                        imageUrl = featuredImage.url;
                      } else {
                        const firstImage = property.media
                          .filter((item) => item.type === "image")
                          .sort((a, b) => a.order_index - b.order_index)[0];
                        if (firstImage) {
                          imageUrl = firstImage.url;
                        }
                      }
                    } else if (property.images && property.images.length > 0) {
                      imageUrl = property.images[0];
                    }

                    if (imageUrl) {
                      return (
                        <img
                          src={imageUrl}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      );
                    } else {
                      return (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-12 h-12 text-slate-400" />
                        </div>
                      );
                    }
                  })()}
                  {property.is_btr && (
                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      BTR
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                    {property.title}
                  </h3>

                  <div className="flex items-center text-slate-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm truncate">{property.address}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-emerald-600 font-semibold">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formatPrice(property.price)}/month
                    </div>
                    <div className="flex items-center gap-4 text-slate-600 text-sm">
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        {property.bedrooms}
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        {property.bathrooms}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <span className="capitalize">{property.property_type}</span>
                    <span className="capitalize">{property.furnishing}</span>
                  </div>

                  <div className="flex items-center text-slate-600 text-sm mb-6">
                    <Calendar className="w-4 h-4 mr-1" />
                    Available from {formatDate(property.available_from)}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        router.push(`/app/properties/${property.id}`)
                      }
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/app/properties/${property.id}/edit`)
                      }
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleViewTenants(property)}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Users className="w-4 h-4" />
                      Tenants
                    </button>
                    <button
                      onClick={() => handleDeleteProperty(property.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interested Tenants Modal */}
        {showTenantModal && selectedProperty && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Interested Tenants
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">
                      {selectedProperty.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTenantModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {isLoadingTenants ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                  </div>
                ) : interestedTenants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No interested tenants yet</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Tenants who shortlist or favourite this property will
                      appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interestedTenants.map((tenant) => (
                      <div
                        key={tenant.user.id}
                        className="bg-slate-50 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {tenant.user.full_name}
                            </h4>
                            <p className="text-slate-600 text-sm">
                              {tenant.user.email}
                            </p>
                            {tenant.user.phone && (
                              <p className="text-slate-600 text-sm">
                                {tenant.user.phone}
                              </p>
                            )}
                            <p className="text-slate-500 text-xs mt-1">
                              Joined {formatDate(tenant.user.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {tenant.interactions.favourited && (
                              <div className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                Favourited
                              </div>
                            )}
                            {tenant.interactions.shortlisted && (
                              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                Shortlisted
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                          {tenant.interactions.favourited && (
                            <div>
                              Favourited:{" "}
                              {formatDate(tenant.interactions.favourited_at!)}
                            </div>
                          )}
                          {tenant.interactions.shortlisted && (
                            <div>
                              Shortlisted:{" "}
                              {formatDate(tenant.interactions.shortlisted_at!)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
