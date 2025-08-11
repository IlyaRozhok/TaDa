"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { propertiesAPI, shortlistAPI, Property } from "../../../lib/api";
import { useTranslations } from "../../../lib/language-context";
import ImageGallery from "../../../components/ImageGallery";
import LifestyleFeatures from "../../../components/LifestyleFeatures";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Home,
  Bed,
  Bath,
  Heart,
  Bookmark,
} from "lucide-react";
import PropertyMap from "../../../components/PropertyMap";

// Individual field skeleton loader component
const FieldSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [shortlistError, setShortlistError] = useState<string | null>(null);
  const [shortlistSuccess, setShortlistSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) {
        setError("Property ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("Fetching property with ID:", id);
        const response = await propertiesAPI.getById(id as string);
        console.log("Property API response:", response);

        // Handle both direct data and response.data formats
        const propertyData = response.data || response;
        console.log("Property data:", propertyData);

        setProperty(propertyData);

        // Check if property is shortlisted
        try {
          const response = await shortlistAPI.checkStatus(id as string);
          const shortlistStatus = response.data?.isShortlisted || false;
          console.log("Shortlist status:", shortlistStatus);
          setIsShortlisted(shortlistStatus);
        } catch (statusError) {
          // If status check fails (e.g., user not logged in), default to false
          console.warn("Could not check shortlist status:", statusError);
          setIsShortlisted(false);
        }
      } catch (err: any) {
        console.error("Error fetching property:", err);
        setError(err.message || "Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleShortlistToggle = async () => {
    if (!property || !id) {
      setShortlistError("Property information is missing");
      return;
    }

    // Clear previous messages
    setShortlistError(null);
    setShortlistSuccess(null);

    try {
      setShortlistLoading(true);

      if (isShortlisted) {
        await shortlistAPI.remove(property.id);
        setIsShortlisted(false);
        setShortlistSuccess("Property removed from shortlist");
      } else {
        await shortlistAPI.add(property.id);
        setIsShortlisted(true);
        setShortlistSuccess("Property added to shortlist");
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setShortlistSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error("Error updating shortlist:", err);
      setShortlistError(
        err.message || "Failed to update shortlist. Please try again."
      );

      // Clear error message after 5 seconds
      setTimeout(() => {
        setShortlistError(null);
      }, 5000);
    } finally {
      setShortlistLoading(false);
    }
  };

  // Clear messages when component unmounts
  useEffect(() => {
    return () => {
      setShortlistError(null);
      setShortlistSuccess(null);
    };
  }, []);

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "£0";

    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";

      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Property Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "The property you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => router.push("/app/dashboard/tenant")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shortlist Notification Messages */}
      {(shortlistError || shortlistSuccess) && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {shortlistError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{shortlistError}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setShortlistError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          {shortlistSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{shortlistSuccess}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setShortlistSuccess(null)}
                    className="text-green-400 hover:text-green-600"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push("/app/dashboard/tenant")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Gallery & Lifestyle Features */}
          <div className="space-y-6">
            {/* Image Gallery */}
            {loading ? (
              <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse"></div>
            ) : (
              <ImageGallery
                media={property?.media}
                images={property?.images}
                alt={property?.title || ""}
              />
            )}

            {/* Compact Lifestyle Features */}
            {!loading &&
              property?.lifestyle_features &&
              property.lifestyle_features.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Amenities & Features
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {property.lifestyle_features.length}
                    </span>
                  </div>
                  <LifestyleFeatures
                    features={property.lifestyle_features}
                    compact={true}
                  />
                </div>
              )}

            {/* Loading state for lifestyle features */}
            {loading && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FieldSkeleton className="w-2 h-2 rounded-full" />
                  <FieldSkeleton className="h-6 w-40" />
                  <FieldSkeleton className="h-5 w-6 rounded-full" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <FieldSkeleton key={i} className="h-12 w-12 rounded-lg" />
                  ))}
                </div>
              </div>
            )}

            {/* Property Stats - Mobile View */}
            <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Info
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Bed className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  {loading ? (
                    <FieldSkeleton className="h-5 w-6 mx-auto mb-1" />
                  ) : (
                    <div className="text-lg font-semibold text-gray-900">
                      {property?.bedrooms}
                    </div>
                  )}
                  <div className="text-xs text-gray-600">
                    Bedroom{property?.bedrooms !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Bath className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  {loading ? (
                    <FieldSkeleton className="h-5 w-6 mx-auto mb-1" />
                  ) : (
                    <div className="text-lg font-semibold text-gray-900">
                      {property?.bathrooms}
                    </div>
                  )}
                  <div className="text-xs text-gray-600">
                    Bathroom{property?.bathrooms !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Property Details */}
          <div className="space-y-6">
            {/* Property Header with Shortlist Toggle */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {loading ? (
                      <FieldSkeleton className="h-8 w-3/4" />
                    ) : (
                      <>
                        <h1 className="text-3xl font-bold text-gray-900">
                          {property?.title || "Property Title"}
                        </h1>
                        {property?.is_btr && (
                          <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-semibold">
                            BTR
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-5 h-5 mr-2" />
                    {loading ? (
                      <FieldSkeleton className="h-5 w-2/3" />
                    ) : (
                      <span className="text-lg">
                        {property?.address || "Address not specified"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Minimal Shortlist Toggle */}
                <button
                  onClick={handleShortlistToggle}
                  disabled={shortlistLoading || loading}
                  className={`p-3 rounded-full border-2 transition-all duration-200 ${
                    isShortlisted
                      ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                      : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={
                    isShortlisted ? "Remove from shortlist" : "Add to shortlist"
                  }
                >
                  {shortlistLoading ? (
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Heart
                      className={`w-6 h-6 ${
                        isShortlisted ? "fill-current" : ""
                      }`}
                    />
                  )}
                </button>
              </div>

              {/* Price */}
              <div className="mb-6">
                {loading ? (
                  <FieldSkeleton className="h-12 w-1/2" />
                ) : (
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(property?.price || 0)}
                    <span className="text-lg font-normal text-gray-600">
                      /month
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  About This Property
                </h2>
                {loading ? (
                  <div className="space-y-2">
                    <FieldSkeleton className="h-4 w-full" />
                    <FieldSkeleton className="h-4 w-full" />
                    <FieldSkeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {property?.description}
                  </p>
                )}
              </div>

              {/* Property Location Map */}
              {!loading && property?.address && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Location
                  </h2>
                  <PropertyMap
                    address={property.address}
                    title={property.title}
                    height="h-64"
                    className="w-full"
                  />
                </div>
              )}

              {loading && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Location
                  </h2>
                  <FieldSkeleton className="h-64 w-full" />
                </div>
              )}

              {/* Property Stats Grid - Desktop View */}
              <div className="hidden lg:grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Bed className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  {loading ? (
                    <FieldSkeleton className="h-6 w-8 mx-auto mb-2" />
                  ) : (
                    <div className="text-xl font-semibold text-gray-900">
                      {property?.bedrooms}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Bedroom{property?.bedrooms !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Bath className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  {loading ? (
                    <FieldSkeleton className="h-6 w-8 mx-auto mb-2" />
                  ) : (
                    <div className="text-xl font-semibold text-gray-900">
                      {property?.bathrooms}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Bathroom{property?.bathrooms !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">
                    Property Type:
                  </span>
                  {loading ? (
                    <FieldSkeleton className="h-5 w-20" />
                  ) : (
                    <span className="text-gray-900 capitalize">
                      {property?.property_type || "Not specified"}
                    </span>
                  )}
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Furnishing:</span>
                  {loading ? (
                    <FieldSkeleton className="h-5 w-24" />
                  ) : (
                    <span className="text-gray-900 capitalize">
                      {property?.furnishing || "Not specified"}
                    </span>
                  )}
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">
                    Available From:
                  </span>
                  {loading ? (
                    <FieldSkeleton className="h-5 w-32" />
                  ) : (
                    <span className="text-gray-900">
                      {formatDate(property?.available_from || "")}
                    </span>
                  )}
                </div>
                {property?.is_btr && (
                  <div className="flex justify-between py-2">
                    <span className="font-medium text-gray-700">
                      Build-to-Rent:
                    </span>
                    <span className="text-green-600 font-semibold">Yes</span>
                  </div>
                )}
              </div>
            </div>

            {/* Operator Info */}
            {!loading && property?.operator && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Listed By
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {property.operator.name?.charAt(0) || "O"}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {property.operator.name}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {property.operator?.roles?.includes("operator")
                        ? "Property Operator"
                        : "Tenant"}
                    </div>
                  </div>
                </div>

                {/* Referencing Link Placeholder */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">
                    Ready to apply? Complete your referencing:
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    📋 Start Referencing Process →
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <FieldSkeleton className="h-6 w-32 mb-4" />
                <div className="flex items-center gap-4 mb-4">
                  <FieldSkeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <FieldSkeleton className="h-5 w-40" />
                    <FieldSkeleton className="h-4 w-24" />
                  </div>
                </div>
                <FieldSkeleton className="h-16 w-full" />
              </div>
            )}

            {/* Contact CTA */}
            {!loading && (
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Interested in this property?
                </h3>
                <p className="text-gray-600 mb-4">
                  Get in touch with the operator for more information or to
                  arrange a viewing.
                </p>
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  📞 Contact Operator
                </button>
              </div>
            )}

            {loading && (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <FieldSkeleton className="h-6 w-48 mx-auto mb-2" />
                <FieldSkeleton className="h-4 w-64 mx-auto mb-4" />
                <FieldSkeleton className="h-12 w-40 mx-auto" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
