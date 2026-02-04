"use client";

import React, { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  propertiesAPI,
  Property,
  matchingAPI,
  bookingRequestsAPI,
  CategoryMatchResult,
} from "../../../lib/api";
import { PropertyMedia } from "../../../types";
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
import { Button } from "@/shared/ui/Button/Button";
import { Heart, Share, Check, X } from "lucide-react";
import TenantUniversalHeader from "../../../components/TenantUniversalHeader";
import BuildingPropertiesSection from "../../../components/BuildingPropertiesSection";
import PreferencePropertiesSection from "../../../components/PreferencePropertiesSection";
import PropertyDetailSkeleton from "../../../components/ui/PropertyDetailSkeleton";
import toast from "react-hot-toast";

type PropertyWithMedia = Property & {
  photos?: string[];
  images?: string[];
  media?: PropertyMedia[];
  building?: {
    id: string;
    name: string;
    address?: string;
  } | null;
  building_type?: string;
  property_type?: string;
  furnishing?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  descriptions?: string;
  description?: string;
  amenities?: string[];
  lifestyle_features?: string[];
};

export default function PropertyPublicPage() {
  const params = useParams();
  const id = params && typeof params.id === "string" ? params.id : null;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const shortlistProperties = useSelector(selectShortlistProperties);

  const [property, setProperty] = useState<PropertyWithMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInShortlist, setIsInShortlist] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchCategories, setMatchCategories] = useState<CategoryMatchResult[]>(
    []
  );
  const [showMatchTooltip, setShowMatchTooltip] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [hasBookingRequest, setHasBookingRequest] = useState(false);

  // Check if description needs truncation
  const needsTruncation = (text: string) => {
    const words = text.split(" ");
    return words.length > 50; // Approximate 3 lines = ~50 words
  };

  // Format amenity name (replace underscores with spaces, capitalize)
  const formatAmenityName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Scroll to top when component mounts - aggressive approach
  useLayoutEffect(() => {
    const scrollToTop = () => {
      // Force immediate scroll to top
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      // Disable smooth scrolling temporarily
      const originalScrollBehavior =
        document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";

      // Multiple scroll attempts for reliability
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Scroll immediately
    scrollToTop();

    // Handle page restoration from bfcache
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache
        scrollToTop();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    // Force scroll on next tick
    const timer1 = setTimeout(scrollToTop, 0);

    // Additional scroll after a short delay
    const timer2 = setTimeout(() => {
      scrollToTop();
      // Restore original scroll behavior
      const originalScrollBehavior =
        document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior =
        originalScrollBehavior || "";
    }, 50);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

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

        // Extract data from response (might be response.data or direct response)
        const propertyData = response.data || response;

        if (propertyData) {
          setProperty(propertyData);
        } else {
          setError("No property data received from server");
        }
      } catch (err: unknown) {
        setError((err as Error)?.message || "Failed to load property details");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  // Load existing booking request for this tenant/property
  useEffect(() => {
    const loadBookingRequest = async () => {
      if (!isAuthenticated || !user || user.role !== "tenant" || !id) {
        setHasBookingRequest(false);
        return;
      }
      try {
        const data = await bookingRequestsAPI.mine(id as string);
        if (Array.isArray(data) && data.length > 0) {
          setHasBookingRequest(true);
        } else {
          setHasBookingRequest(false);
        }
      } catch (err) {
        // silently ignore to not block page
        setHasBookingRequest(false);
      }
    };

    loadBookingRequest();
  }, [id, isAuthenticated, user]);

  // Load match score for authenticated users
  useEffect(() => {
    const fetchMatchScore = async () => {
      if (!id || !isAuthenticated || !user || user.role !== "tenant") {
        setMatchScore(null);
        return;
      }

      try {
        setMatchLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) {
          return;
        }

        const response = await matchingAPI.getPropertyMatch(id as string);
        const matchData = response.data || response;

        // Extract match percentage and categories from response
        const score = matchData.matchPercentage || matchData.matchScore || null;
        setMatchScore(score);

        // Extract categories if available
        if (matchData.categories && Array.isArray(matchData.categories)) {
          setMatchCategories(matchData.categories);
        }
      } catch (err: unknown) {
        // Silently fail - match score is optional
        console.warn("Failed to load match score:", err);
        setMatchScore(null);
      } finally {
        setMatchLoading(false);
      }
    };

    fetchMatchScore();
  }, [id, isAuthenticated, user]);

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
      return [];
    }

    // Use property.media for images
    const mediaArray = property.media || [];

    const mediaUrls = mediaArray
      .map((m: PropertyMedia) => {
        const url = m.url;
        return url;
      })
      .filter(Boolean);

    const legacy = property.images || [];
    const photos = property.photos || [];

    const allUrls = [...mediaUrls, ...legacy, ...photos];

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
    } catch (error: unknown) {
      // Keep error logging for errors, as per best practice
      // But if you want to remove all console usage, comment out the next line:
      // console.error("Shortlist error:", error);
      toast.error((error as Error)?.message || "Failed to update shortlist");
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleBookApartment = async () => {
    if (!property) {
      return;
    }

    if (!isAuthenticated || !user) {
      toast.error("Please login as a tenant to book");
      router.push("/auth/login");
      return;
    }

    if (user.role !== "tenant") {
      toast.error("Only tenant accounts can book apartments");
      return;
    }

    try {
      setBookingLoading(true);
      await bookingRequestsAPI.create(property.id);
      toast.success("Request sent. Our team will contact you shortly.");
      setHasBookingRequest(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send booking request";
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader showPreferencesButton={true} />
        <PropertyDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TenantUniversalHeader showPreferencesButton={true} />
        <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <TenantUniversalHeader showPreferencesButton={true} />
        <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  const publishDate = new Date(property.created_at || Date.now());

  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: "auto" }}>
      <TenantUniversalHeader showPreferencesButton={true} />

      {/* Header with title and actions */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                {property.title || "Property Title"}
              </h1>
              <button
                className="flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white text-gray-600 transition-colors cursor-pointer rounded-lg shadow-md hover:shadow-lg"
                aria-label="Share property"
              >
                <Share className="w-5 h-5" />
              </button>
              <button
                onClick={handleShortlistToggle}
                disabled={shortlistLoading}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all cursor-pointer shadow-md hover:shadow-lg ${
                  isInShortlist
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-white/90 hover:bg-white text-gray-600"
                }`}
                aria-label={
                  isInShortlist ? "Remove from shortlist" : "Add to shortlist"
                }
              >
                <Heart
                  className={`w-5 h-5 ${isInShortlist ? "fill-current" : ""}`}
                />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-gray-600">
              <span className="text-sm sm:text-base">
                {property.address || "Address not available"}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm text-gray-500">
                Publish date {publishDate.toLocaleDateString("en-GB")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content: gallery + sticky price card */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left: Gallery with preview carousel */}
          <div className="lg:col-span-2 relative">
            {allImages.length > 0 ? (
              <>
                {/* Main image */}
                <div className="relative rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden mb-1 sm:mb-1.5 lg:mb-1">
                  <ImageGallery
                    media={property.media || []}
                    images={[
                      ...(property.images || []),
                      ...(property.photos || []),
                    ]}
                    alt={property.title || "Property"}
                  />

                  {/* Match indicator - same style as app/units */}
                  {isAuthenticated && user?.role === "tenant" && (
                    <div
                      className="absolute top-4 left-4 z-30"
                      onMouseEnter={() => setShowMatchTooltip(true)}
                      onMouseLeave={() => setShowMatchTooltip(false)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {matchLoading ? (
                        <div className="flex items-center backdrop-blur-[3px] gap-2 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg cursor-pointer bg-black/60 text-white">
                          <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          Loading...
                        </div>
                      ) : matchScore !== null ? (
                        <div className="flex items-center backdrop-blur-[3px] gap-2 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg cursor-pointer bg-black/60 text-white">
                          <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          {Math.round(matchScore)}% Match
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Photo counter */}
                  <div className="absolute top-1 sm:top-1 right-1 sm:right-1 bg-black/80 text-white px-0.75 py-0.25 rounded-lg text-xs sm:text-sm font-medium">
                    1 / {allImages.length}
                  </div>
                </div>

                {/* Match Tooltip - positioned outside overflow-hidden container */}
                {isAuthenticated &&
                  user?.role === "tenant" &&
                  matchScore !== null &&
                  showMatchTooltip && (
                    <div className="absolute top-[72px] left-4 w-80 bg-black/60 backdrop-blur-[3px] text-white rounded-lg p-4 shadow-xl z-[9999] pointer-events-none">
                      {/* Arrow */}
                      <div className="absolute -top-2 left-6">
                        <div className="w-4 h-4 bg-black/60 rotate-45"></div>
                      </div>

                      <h3 className="text-base font-semibold text-white mb-3">
                        Why this matches?
                      </h3>

                      <div className="space-y-2">
                        {matchCategories
                          .filter((cat) => cat.maxScore > 0)
                          .sort((a, b) => b.maxScore - a.maxScore)
                          .slice(0, 6)
                          .map((cat, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-0.5">
                                {cat.match ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <X className="w-4 h-4 text-red-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-white text-xs leading-relaxed">
                                  {cat.details || cat.reason}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>

                      {matchCategories.filter((cat) => cat.maxScore > 0)
                        .length === 0 && (
                        <p className="text-gray-300 text-sm">
                          No specific matching criteria available
                        </p>
                      )}
                    </div>
                  )}

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
                  <button className="text-black text-sm sm:text-base font-medium underline hover:text-gray-600 mt-2 sm:mt-3 transition-colors">
                    See all photo ({allImages.length})
                  </button>
                )}
              </>
            ) : (
              <div className="relative rounded-2xl overflow-hidden mb-4 h-96 flex items-center justify-center">
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

            {/* Details section under gallery */}
            <div className="mt-6 sm:mt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                Details
              </h2>
              <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      Property type
                    </p>
                    <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg text-sm sm:text-base">
                      {property.building_type === "btr"
                        ? "Built to rent"
                        : property.building_type || "Apartment"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      Property type
                    </p>
                    <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg text-sm sm:text-base">
                      {property.property_type || "Apartment"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      Furnishing
                    </p>
                    <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg text-sm sm:text-base">
                      {property.furnishing
                        ? property.furnishing.charAt(0).toUpperCase() +
                          property.furnishing.slice(1)
                        : "Unfurnished"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      Bedrooms
                    </p>
                    <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg text-sm sm:text-base">
                      {property.bedrooms || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      Bathrooms
                    </p>
                    <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg text-sm sm:text-base">
                      {property.bathrooms || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      Size
                    </p>
                    <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg text-sm sm:text-base">
                      {property.square_meters
                        ? `${Math.round(property.square_meters * 10.764)} sq ft`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Operator info and booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {/* Building info */}
              {property.building && (
                <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    <div className="text-center leading-tight px-1">
                      <div>BUILDING</div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-start flex-1">
                    <div className="text-gray-600 text-sm mb-1">Building</div>
                    <button
                      className="font-semibold text-black mb-1 hover:text-gray-700 transition-colors text-left"
                      onClick={() =>
                        router.push(`/app/buildings/${property.building?.id}`)
                      }
                    >
                      {property.building?.name}
                    </button>
                    <button
                      className="text-black text-sm underline text-left cursor-pointer font-medium hover:text-slate-700 transition-colors"
                      onClick={() =>
                        router.push(`/app/buildings/${property.building?.id}`)
                      }
                    >
                      See more about this building
                    </button>
                  </div>
                </div>
              )}

              {/* Availability */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Available from</p>
                <p className="text-base font-bold text-black">
                  {property.available_from
                    ? new Date(property.available_from).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : "Not specified"}
                </p>
              </div>

              {/* Price and booking */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                <div className="mb-4">
                  <div className="text-3xl sm:text-4xl font-bold text-black mb-1">
                    £{Number(property.price || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Price per month</div>
                </div>

                <Button
                  className="w-full bg-black hover:bg-gray-800 cursor-pointer text-white py-3 sm:py-4 rounded-full text-sm sm:text-base font-semibold mb-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  onClick={handleBookApartment}
                  disabled={bookingLoading || hasBookingRequest}
                >
                  {hasBookingRequest
                    ? "Book requested"
                    : bookingLoading
                    ? "Sending..."
                    : "Book this apartment"}
                </Button>

                <p className="text-xs text-gray-500 text-center mb-6">
                  You won&apos;t be charged yet, only after reservation and
                  approve your form
                </p>

                {/* Payment breakdown */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-semibold text-black mb-4 text-sm sm:text-base">
                    More about next payments
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        2 month x £
                        {Number(property.price || 0).toLocaleString()}
                      </span>
                      <span className="font-semibold text-black">
                        £{(Number(property.price || 0) * 2).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tada fee</span>
                      <span className="text-gray-600">£142.5</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="font-semibold text-black">Total</span>
                      <span className="font-bold text-black text-base">
                        £
                        {(
                          Number(property.price || 0) * 2 +
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

      {/* About apartment */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          About apartment
        </h2>
        <div className="text-gray-700 leading-relaxed text-sm sm:text-base">
          {(() => {
            const description =
              property.descriptions ||
              property.description ||
              "Spacious family home spread over three floors with a beautiful rear garden. Perfect for families, featuring multiple reception rooms and a modern kitchen extension.";
            const showTruncation = needsTruncation(description);

            return (
              <>
                <div
                  className={`${
                    showTruncation && !showFullDescription ? "line-clamp-3" : ""
                  } overflow-hidden`}
                >
                  {description}
                </div>
                {showTruncation && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-black underline text-sm hover:text-gray-600 font-medium mt-2"
                  >
                    {showFullDescription ? "Show less" : "More information"}
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* What this place offers */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-t border-gray-200">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          What this place offers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {(() => {
            // Get amenities from property
            const allAmenities =
              property.amenities && property.amenities.length > 0
                ? property.amenities
                : property.lifestyle_features &&
                  property.lifestyle_features.length > 0
                ? property.lifestyle_features
                : [];

            const visibleAmenities = showAllOffers
              ? allAmenities
              : allAmenities.slice(0, 9);

            return visibleAmenities.length > 0 ? (
              visibleAmenities.map((amenity: string, i: number) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3 py-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base text-black">
                    {formatAmenityName(amenity)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No amenities listed</p>
            );
          })()}
        </div>
        {(() => {
          const allAmenitiesList =
            property.amenities && property.amenities.length > 0
              ? property.amenities
              : property.lifestyle_features &&
                property.lifestyle_features.length > 0
              ? property.lifestyle_features
              : [];

          const hiddenCount = allAmenitiesList.length - 9;

          return (
            hiddenCount > 0 && (
              <button
                onClick={() => setShowAllOffers(!showAllOffers)}
                className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
              >
                {showAllOffers
                  ? `Show less`
                  : `See all offers (${allAmenitiesList.length})`}
              </button>
            )
          );
        })()}
      </div>

      {/* Accommodation Terms */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-t border-gray-200">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
          Accommodation Terms
        </h2>
        <p className="text-gray-600 mb-6">
          Kings Cross Apartments accepts special requests — add them on the next
          step
        </p>

        <div className="space-y-6">
          {/* Check-in */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">Check-in</h3>
              <div className="text-gray-700">
                <p className="font-medium">From 4:00 PM</p>
                <p className="text-sm mt-1">
                  When registering for check-in, you must present a valid ID
                  with photo and credit card.
                </p>
                <p className="text-sm mt-1">
                  Please inform the administration in advance how many people
                  will be arriving.
                </p>
              </div>
            </div>
          </div>

          {/* Check-out */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m10 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">Check-out</h3>
              <div className="text-gray-700">
                <p className="font-medium">Until 11:00 AM</p>
              </div>
            </div>
          </div>

          {/* Cancellation/Prepayment */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">
                Cancellation/Prepayment
              </h3>
              <div className="text-gray-700">
                <p className="text-sm">
                  Cancellation and prepayment policies vary depending on
                  accommodation type.{" "}
                  <button className="text-blue-600 underline hover:text-blue-800">
                    Check accommodation dates
                  </button>{" "}
                  and familiarize yourself with the terms that apply to your
                  desired option.
                </p>
              </div>
            </div>
          </div>

          {/* Children policy */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">Children policy</h3>
              <div className="text-gray-700 space-y-3">
                <p className="font-medium">Children accommodation policy</p>
                <p className="text-sm">
                  Children of all ages are allowed to stay.
                </p>
                <p className="text-sm">
                  To see exact prices and occupancy information, please specify
                  the number of children in your group and their ages when
                  searching.
                </p>
                <div className="mt-4">
                  <p className="font-medium text-sm mb-2">
                    Crib and extra bed policy
                  </p>
                  <p className="text-sm">
                    Extra beds and cribs are not provided.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Age restrictions */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">
                No age restrictions
              </h3>
              <div className="text-gray-700">
                <p className="text-sm">
                  There are no age restrictions for check-in.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment system */}
        <div className="mt-8 p-6 bg-gray-50 rounded-2xl border">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">
                Payment system via Booking.com
              </h3>
              <div className="text-gray-700">
                <p className="text-sm">
                  Booking.com accepts payment for this reservation on behalf of
                  the accommodation, but asks you to have cash on hand for any
                  additional expenses on site.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important notes */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-black mb-4">
            * Important Notes
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Important information for guests of this accommodation option.
          </p>

          <div className="space-y-4 text-gray-700 text-sm">
            <p>
              When registering for check-in, you must present a valid ID with
              photo and bank card. Please note that fulfilling special requests
              is not guaranteed and may require additional payment.
            </p>
            <p>
              Please inform Kings Cross Apartments in advance of your expected
              arrival time. You can use the &quot;Special Requests&quot; field
              when booking or contact the property directly — contact details
              are provided in your booking confirmation.
            </p>
            <p>
              Bachelor/bachelorette parties and similar events are not allowed
              at this property.
            </p>
          </div>
        </div>
      </div>

      {/* See more apartments from this building */}
      {property.building && (
        <BuildingPropertiesSection
          buildingId={property.building.id}
          buildingName={property.building.name}
          currentPropertyId={property.id}
        />
      )}

      {/* Other options from your preferences */}
      <PreferencePropertiesSection
        currentPropertyId={property.id}
        currentOperatorId={property.operator?.id}
      />
    </div>
  );
}
