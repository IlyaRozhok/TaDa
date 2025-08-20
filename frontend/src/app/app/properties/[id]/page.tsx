"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { propertiesAPI, Property } from "../../../lib/api";
import {
  addToShortlist,
  removeFromShortlist,
  selectShortlistProperties,
} from "../../../store/slices/shortlistSlice";
import { AppDispatch } from "../../../store/store";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import ImageGallery from "../../../components/ImageGallery";
import { Button } from "../../../components/ui/Button";
import DashboardHeader from "../../../components/DashboardHeader";
import { Heart, Share, Search, Bell, ChevronDown, User } from "lucide-react";
import PropertyMap from "../../../components/PropertyMap";
import toast from "react-hot-toast";

export default function PropertyPublicPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const shortlistProperties = useSelector(selectShortlistProperties);

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

  // Check if property is in shortlist using Redux state (avoid API calls to prevent cycling)
  useEffect(() => {
    if (!property || !isAuthenticated || !user || user.role !== "tenant") {
      setIsInShortlist(false);
      return;
    }

    // Check if current property is in shortlist from Redux state
    const isPropertyInShortlist = shortlistProperties.some(
      (shortlistProperty) => shortlistProperty.id === property.id
    );
    setIsInShortlist(isPropertyInShortlist);
  }, [property, isAuthenticated, user, shortlistProperties]);

  const allImages: string[] = useMemo(() => {
    if (!property) {
      console.log("🖼️ No property data");
      return [];
    }

    console.log("🖼️ Processing images for property:", property.title);

    // Use property.media for images
    const mediaArray = property.media || [];
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

    if (user.role !== "tenant") {
      toast.error("Only tenants can add properties to shortlist");
      return;
    }

    setShortlistLoading(true);
    try {
      if (isInShortlist) {
        // Use Redux action instead of direct API call
        await dispatch(removeFromShortlist(id as string)).unwrap();
        setIsInShortlist(false);
        toast.success("Removed from shortlist");
      } else {
        // Use Redux action instead of direct API call
        await dispatch(
          addToShortlist({
            propertyId: id as string,
            property: property || undefined,
          })
        ).unwrap();
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
      {/* Custom Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-black">:: TADA</h1>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search property, location, or type of property"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center space-x-4">
            <button className="text-black hover:text-gray-600 transition-colors">
              <Heart className="h-6 w-6" />
            </button>
            <button className="text-black hover:text-gray-600 transition-colors">
              <Bell className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-1 text-black cursor-pointer">
              <span className="text-sm font-medium">EN</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            <button className="text-black hover:text-gray-600 transition-colors">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Header with title and actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-black">
                {property.title || "Property Title"}
              </h1>
              <button className="flex items-center gap-2 bg-white/90 hover:bg-white text-gray-600 transition-colors cursor-pointer rounded-lg px-3 py-2 shadow-lg">
                <Share className="w-4 h-4" />
              </button>
              <button
                onClick={handleShortlistToggle}
                disabled={shortlistLoading}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-lg ${
                  isInShortlist
                    ? "bg-red-500/90 hover:bg-red-500 text-white"
                    : "bg-white/90 hover:bg-white text-gray-600"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isInShortlist ? "fill-current" : ""}`}
                />
              </button>
            </div>
            <div className="flex items-center text-black mb-2">
              <span>{property.address || "Address not available"}</span>
              <span className="mx-2">•</span>
              <span className="text-sm">
                Publish date {publishDate.toLocaleDateString("en-GB")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content: gallery + sticky price card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Gallery with preview carousel */}
          <div className="lg:col-span-2">
            {allImages.length > 0 ? (
              <>
                {/* Main image */}
                <div className="relative rounded-2xl overflow-hidden mb-4">
                  <ImageGallery
                    media={property.media || []}
                    images={property.images || []}
                    alt={property.title || "Property"}
                  />

                  {/* Match indicator */}
                  <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg border border-white/20">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-white/30 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">90% Match</span>
                    </div>
                  </div>

                  {/* Photo counter */}
                  <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-medium">
                    1 / {allImages.length}
                  </div>
                </div>

                {/* Preview carousel - 2x2 grid */}
                {/* <div className="grid grid-cols-2 gap-2 max-w-[200px] mb-4">
                  {allImages.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className={`w-24 h-20 rounded-lg overflow-hidden border-2 ${
                        index === 0 ? "border-black" : "border-gray-200"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div> */}

                {/* See all photos button */}
                {allImages.length > 1 && (
                  <button className="text-black text-sm underline hover:text-gray-600">
                    See all photo ({allImages.length})
                  </button>
                )}
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
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

          {/* Right: Operator info and booking */}
          <div className="lg:col-span-1">
            <div className="rounded-xl ">
              {/* Property owner info */}

              <div className="flex items-start gap-3 mb-3 max-w-[400px]">
                <div className="w-12 h-12 bg-red-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-xs">
                  <div className="text-center leading-tight">
                    <div>AUTHOR</div>
                    <div>KING&apos;S</div>
                    <div>CROSS</div>
                  </div>
                </div>
                <div className="flex flex-col justify-start">
                  <div className="text-gray-600 text-sm">Property owner</div>
                  <div className="font-semibold text-black mb-1 max-w-[200px]">
                    {property.operator?.full_name}
                  </div>
                  <button className="text-black text-sm underline text-left cursor-pointer font-bold hover:text-slate-700 max-w-[180px]">
                    See more apartment from this owner
                  </button>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-baseline justify-start mt-4 p-3">
                <p className="text-md font-semibold text-black mr-1">
                  Available from
                </p>
                <p className="text-md font-bold text-black mr-2">
                  {property.available_from
                    ? new Date(property.available_from).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : "20 March 2024"}
                </p>
              </div>

              {/* Price and booking */}
              <div className="p-3">
                <div className="flex items-center justify-start mb-2">
                  <div className="text-3xl font-bold text-black mr-2">
                    £{Number(property.price || 1712).toLocaleString()}
                  </div>
                  <div className="text-md text-gray-600 mr-2">
                    Price per month
                  </div>
                </div>

                <Button className="w-full bg-black hover:bg-gray-800 cursor-pointer text-white py-4 rounded-full text-base font-semibold my-2">
                  Book this apartment
                </Button>

                <p className="text-xs text-gray-500 mb-6 text-center">
                  You won&apos;t be charged yet, only after reservation and
                  approve your form
                </p>

                {/* Payment breakdown */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-black mb-3">
                    More about next payments
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        2 month x £
                        {Number(property.price || 1712).toLocaleString()}
                      </span>
                      <span className="font-semibold text-black">
                        £{(Number(property.price || 1712) * 2).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tada fee</span>
                      <span className="font-semibold text-black">£142.5</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span className="text-black">Total</span>
                      <span className="text-black">
                        £
                        {(
                          Number(property.price || 1712) * 2 +
                          142.5
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
        <h2 className="text-2xl font-semibold text-black mb-6">Details</h2>
        <div className="bg-white rounded-2xl border p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">Property type</p>
              <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg">
                Built to rent
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Property type</p>
              <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg">
                Apartment
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Furnishing</p>
              <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg">
                {property.furnishing || "Furnished"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Bedrooms</p>
              <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg">
                {property.bedrooms || 1}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Bathrooms</p>
              <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg">
                {property.bathrooms || 1}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Size</p>
              <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg">
                497 sq ft
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About apartment */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-black mb-6">
          About apartment
        </h2>
        <div className="text-gray-700 leading-relaxed space-y-4">
          <p>
            {property.description ||
              "Kings Cross Apartments — это апартаменты в центре города Лондон, расположенные в 700 м и 600 м соответственно от следующих достопримечательностей: Железнодорожный вокзал Кингс-Кросс и Станция метро King's Cross St Pancras. Среди удобств есть гостиная зона и бесплатный Wi-Fi. В каждой единице"}
          </p>
          <button className="text-gray-600 underline text-sm hover:text-gray-900">
            More information
          </button>
        </div>
      </div>

      {/* What this place offers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-black mb-6">
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
