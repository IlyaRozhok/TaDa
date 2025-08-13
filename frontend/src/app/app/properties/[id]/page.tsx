"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { propertiesAPI, shortlistAPI, Property } from "../../../lib/api";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import ImageGallery from "../../../components/ImageGallery";
import LifestyleFeatures from "../../../components/LifestyleFeatures";
import { Button } from "../../../components/ui/Button";
import DashboardHeader from "../../../components/DashboardHeader";
import {
  MapPin,
  Calendar,
  Bed,
  Bath,
  Heart,
  Share,
  User,
  Mail,
  Phone,
} from "lucide-react";
import PropertyMap from "../../../components/PropertyMap";
import toast from "react-hot-toast";

export default function PropertyPublicPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInShortlist, setIsInShortlist] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);

  console.log("🏠 Component state:", {
    id,
    loading,
    error,
    hasProperty: !!property,
    propertyTitle: property?.title,
  });

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
        const response = await propertiesAPI.getByIdPublic(id as string);
        console.log("🏠 Raw API response:", response);

        // Extract data from response (might be response.data or direct response)
        const propertyData = response.data || response;
        console.log("🏠 Property data extracted:", propertyData);
        console.log("🖼️ Property title:", propertyData.title);
        console.log("🖼️ Media array:", propertyData.media);
        console.log("🖼️ Images array:", propertyData.images);

        if (propertyData) {
          console.log("✅ Property data set successfully:", propertyData.title);
          setProperty(propertyData);
        } else {
          console.log("❌ No property data received");
          setError("No property data received from server");
        }
      } catch (err: any) {
        console.error("❌ Error fetching property:", err);
        setError(err.message || "Failed to load property details");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  // Check if property is in shortlist
  useEffect(() => {
    const checkShortlistStatus = async () => {
      if (!property || !isAuthenticated || !user) return;

      try {
        const response = await shortlistAPI.checkStatus(property.id);
        setIsInShortlist(response.data?.isInShortlist || false);
      } catch (error) {
        console.log("Could not check shortlist status:", error);
      }
    };

    checkShortlistStatus();
  }, [property, isAuthenticated, user]);

  const allImages: string[] = useMemo(() => {
    if (!property) {
      console.log("🖼️ No property data");
      return [];
    }

    console.log("🖼️ Processing images for property:", property.title);

    // Try both property.media and property.property_media
    const mediaArray = property.media || property.property_media || [];
    console.log("🖼️ Media array found:", mediaArray);

    const mediaUrls = mediaArray
      .map((m: any) => {
        const url = m.url || m.s3_url;
        console.log("🖼️ Processing media item:", {
          id: m.id,
          url,
          s3_key: m.s3_key,
        });
        return url;
      })
      .filter(Boolean);

    console.log("🖼️ Media URLs extracted:", mediaUrls);

    const legacy = property.images || [];
    console.log("🖼️ Legacy images:", legacy);

    const allUrls = [...mediaUrls, ...legacy];
    console.log("🖼️ Final image URLs:", allUrls);

    if (allUrls.length > 0) {
      console.log(`🖼️ Returning ${allUrls.length} images for property`);
    } else {
      console.log("🖼️ No images found, will show placeholder");
    }

    // Only return real property images, no fallbacks
    return allUrls;
  }, [property]);

  const handleShortlistToggle = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please login to add properties to shortlist");
      return;
    }

    setShortlistLoading(true);
    try {
      if (isInShortlist) {
        await shortlistAPI.remove(id as string);
        setIsInShortlist(false);
        toast.success("Removed from shortlist");
      } else {
        await shortlistAPI.add(id as string);
        setIsInShortlist(true);
        toast.success("Added to shortlist");
      }
    } catch (error: any) {
      console.error("Shortlist error:", error);
      toast.error(error.message || "Failed to update shortlist");
    } finally {
      setShortlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading property details...</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-red-800 mb-4">
              Failed to Load Property
            </h3>
            <p className="text-red-600 mb-8">{error}</p>
            <button
              onClick={() => router.push("/app/properties")}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Back to Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-yellow-800 mb-4">
              Property Not Found
            </h3>
            <p className="text-yellow-600 mb-8">
              The requested property could not be found.
            </p>
            <button
              onClick={() => router.push("/app/properties")}
              className="bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
            >
              Back to Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  const publishDate = new Date(
    (property as any).created_at || (property as any).createdAt || Date.now()
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      {/* Header with title and actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {property.title || "Property Title"}
            </h1>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{property.address || "Address not available"}</span>
              <span className="mx-2">•</span>
              <span className="text-sm">
                Publish date {publishDate.toLocaleDateString("en-GB")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Share className="w-4 h-4" />
            </button>
            <button
              onClick={handleShortlistToggle}
              disabled={shortlistLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isInShortlist
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${isInShortlist ? "fill-current" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main content: gallery + sticky price card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Gallery */}
          <div className="lg:col-span-2">
            {allImages.length > 0 ? (
              <>
                <div className="relative rounded-2xl overflow-hidden mb-4">
                  <ImageGallery
                    media={property.media || property.property_media || []}
                    images={property.images || []}
                    alt={property.title || "Property"}
                  />
                  {allImages.length > 1 && (
                    <button className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-900 text-sm font-semibold rounded-lg px-4 py-2 shadow-lg">
                      See all photo ({allImages.length})
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="relative rounded-2xl overflow-hidden mb-4 bg-gray-100 h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">No images available</p>
                  <p className="text-sm">
                    Images for this property will be added soon
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Price card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Property owner info */}
              <div className="bg-white rounded-xl p-6 mb-6 border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    AUTHOR
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Property owner
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {property.operator?.full_name || "Property Operator"}
                    </p>
                  </div>
                </div>
                <button className="text-gray-600 text-sm underline hover:text-gray-900">
                  See more apartment from this owner
                </button>
              </div>

              {/* Availability */}
              <div className="bg-white rounded-xl p-6 mb-6 border">
                <p className="text-gray-600 text-sm mb-2">Available from</p>
                <p className="text-lg font-semibold text-gray-900">
                  {property.available_from
                    ? new Date(property.available_from).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : "To be confirmed"}
                </p>
              </div>

              {/* Price card */}
              <div className="bg-white rounded-xl p-6 border">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  £{Number(property.price || 0).toLocaleString()}
                </div>
                <p className="text-gray-600 text-sm mb-6">Price per month</p>

                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-full text-base font-semibold mb-4">
                  Book this apartment
                </Button>

                <p className="text-xs text-gray-500 mb-6 text-center">
                  You won't be charged yet, only after reservation and approve
                  your form
                </p>

                {/* Payment breakdown */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    More about next payments
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        2 month x £
                        {Number(property.price || 0).toLocaleString()}
                      </span>
                      <span className="font-semibold text-gray-900">
                        £{(Number(property.price || 0) * 2).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tada fee</span>
                      <span className="font-semibold text-gray-900">
                        £{(Number(property.price || 0) * 0.1).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">
                        £
                        {(
                          Number(property.price || 0) * 2 +
                          Number(property.price || 0) * 0.1
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Details</h2>
        <div className="bg-white rounded-2xl border p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">Property type</p>
              <p className="font-semibold text-gray-900">Built to rent</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Property type</p>
              <p className="font-semibold text-gray-900">Apartment</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Furnishing</p>
              <p className="font-semibold text-gray-900">
                {property.furnishing || "Furnished"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Bedrooms</p>
              <p className="font-semibold text-gray-900">
                {property.bedrooms || 1}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Bathrooms</p>
              <p className="font-semibold text-gray-900">
                {property.bathrooms || 1}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Size</p>
              <p className="font-semibold text-gray-900">497 sq ft</p>
            </div>
          </div>
        </div>
      </div>

      {/* About apartment */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          About apartment
        </h2>
        <div className="text-gray-700 leading-relaxed space-y-4">
          <p>
            {property.description ||
              "No description available for this property."}
          </p>
          <button className="text-gray-600 underline text-sm hover:text-gray-900">
            More information
          </button>
        </div>
      </div>

      {/* What this place offers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          What this place offers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Real lifestyle features from property */}
          {(property.lifestyle_features || []).map((amenity, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-5 h-5 border border-gray-300 rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
              </div>
              <span className="text-gray-800 capitalize">{amenity}</span>
            </div>
          ))}
          {(!property.lifestyle_features ||
            property.lifestyle_features.length === 0) && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No amenities listed for this property
            </div>
          )}
        </div>
        {property.lifestyle_features &&
          property.lifestyle_features.length > 0 && (
            <button className="mt-6 px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
              See all offers ({property.lifestyle_features.length})
            </button>
          )}
      </div>

      {/* Location */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Appart location
        </h2>
        <p className="text-gray-600 mb-6">
          {property.address || "Address not available"}
        </p>
        <div className="rounded-2xl overflow-hidden border">
          <PropertyMap
            address={property.address || "London, UK"}
            title={property.title}
            height="h-[400px]"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
