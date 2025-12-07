"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { propertiesAPI, Property, matchingAPI } from "../../../lib/api";
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
import { Button } from "../../../components/ui/Button";
import { Heart, Share } from "lucide-react";
import TaDaMap from "../../../components/TaDaMap";
import UniversalHeader from "../../../components/UniversalHeader";
import OwnerPropertiesSection from "../../../components/OwnerPropertiesSection";
import PreferencePropertiesSection from "../../../components/PreferencePropertiesSection";
import PropertyDetailSkeleton from "../../../components/ui/PropertyDetailSkeleton";
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
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // Check if description needs truncation
  const needsTruncation = (text: string) => {
    const words = text.split(" ");
    return words.length > 50; // Approximate 3 lines = ~50 words
  };

  // Format amenity name (replace underscores with spaces, capitalize)
  const formatAmenityName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

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

        // Extract match percentage from response
        const score = matchData.matchPercentage || matchData.matchScore || null;
        setMatchScore(score);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <UniversalHeader />
        <PropertyDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <UniversalHeader />
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
        <UniversalHeader />
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
    <div className="min-h-screen bg-white">
      <UniversalHeader />

      {/* Header with title and actions */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-25">
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
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Gallery with preview carousel */}
          <div className="lg:col-span-2">
            {allImages.length > 0 ? (
              <>
                {/* Main image */}
                <div className="relative rounded-2xl overflow-hidden mb-4">
                  <ImageGallery
                    media={property.media || []}
                    images={[
                      ...(property.images || []),
                      ...(property.photos || []),
                    ]}
                    alt={property.title || "Property"}
                  />

                  {/* Match indicator */}
                  {isAuthenticated && user?.role === "tenant" && (
                    <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg border border-white/20">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-white/30 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        {matchLoading ? (
                          <span className="text-sm font-medium">
                            Loading...
                          </span>
                        ) : matchScore !== null ? (
                          <span className="text-sm font-medium">
                            {matchScore}% Match
                          </span>
                        ) : (
                          <span className="text-sm font-medium">Match</span>
                        )}
                      </div>
                    </div>
                  )}

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
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-black mb-3">
                Details
              </h2>
              <div className="bg-white rounded-2xl border p-6">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-8">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">BTR</p>
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
                      {property.furnishing || "unfurnished"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Bedrooms</p>
                    <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg">
                      {property.bedrooms || 4}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Bathrooms</p>
                    <p className="font-semibold text-black bg-gray-100 px-3 py-2 rounded-lg">
                      {property.bathrooms || 3}
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
                  <button
                    className="font-semibold text-black mb-1 max-w-[200px] hover:text-gray-700 transition-colors text-left"
                    onClick={() =>
                      router.push(`/app/operators/${property.operator?.id}`)
                    }
                  >
                    {property.operator?.full_name}
                  </button>
                  <button
                    className="text-black text-sm underline text-left cursor-pointer font-bold hover:text-slate-700 max-w-[180px]"
                    onClick={() =>
                      router.push(`/app/operators/${property.operator?.id}`)
                    }
                  >
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
                  <div className="text-3xl font-bold text-black mr-3">
                    £{Number(property.price || 1712).toLocaleString()}
                  </div>
                  <div className="text-md text-gray-600 ml-3">
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
                      <span className="text-gray-600">£142.5</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Total</span>
                      <span className="text-gray-600">
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

      {/* About apartment */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-black mb-3">
          About apartment
        </h2>
        <div className="text-gray-700 leading-relaxed space-y-4">
          {(() => {
            const description =
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
                    className="text-black underline text-sm hover:text-gray-600 font-medium"
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
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-black mb-3">
          What this place offers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3">
          {(() => {
            // Get amenities from property or use defaults from screenshot
            const allAmenities =
              property.lifestyle_features &&
              property.lifestyle_features.length > 0
                ? property.lifestyle_features
                : [
                    "Family_home",
                    "Rear_garden",
                    "Multiple_reception",
                    "Kitchen_extension",
                    "Three_floors",
                  ];

            const visibleAmenities = showAllOffers
              ? allAmenities
              : allAmenities.slice(0, 5);

            return visibleAmenities.map((amenity, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <svg
                  className="w-6 h-6 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span className="text-gray-800">
                  {formatAmenityName(amenity)}
                </span>
              </div>
            ));
          })()}
        </div>
        {(() => {
          const allAmenities =
            property.lifestyle_features &&
            property.lifestyle_features.length > 0
              ? property.lifestyle_features
              : [
                  "Family_home",
                  "Rear_garden",
                  "Multiple_reception",
                  "Kitchen_extension",
                  "Three_floors",
                ];

          const hiddenCount = allAmenities.length - 5;

          return (
            hiddenCount > 0 && (
              <button
                onClick={() => setShowAllOffers(!showAllOffers)}
                className="mt-6 px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {showAllOffers
                  ? `Show less`
                  : `See all offers (${allAmenities.length})`}
              </button>
            )
          );
        })()}
      </div>

      {/* Location */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Appart location
        </h2>
        <p className="text-gray-600 mb-6">
          {property.address || "Address not available"}
        </p>
        <div className="rounded-2xl overflow-hidden border">
          <TaDaMap
            properties={[property]}
            center={
              property.lat && property.lng
                ? {
                    lat:
                      typeof property.lat === "string"
                        ? parseFloat(property.lat)
                        : property.lat,
                    lng:
                      typeof property.lng === "string"
                        ? parseFloat(property.lng)
                        : property.lng,
                  }
                : { lat: 51.5074, lng: -0.1278 }
            }
            zoom={15}
            height="400px"
            className="w-full"
            showLoadingOverlay={false}
          />
        </div>
      </div>

      {/* Accommodation Terms */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-black mb-3">
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

      {/* See more apartments from this owner */}
      {property.operator && (
        <OwnerPropertiesSection
          operatorId={property.operator.id}
          operatorName={property.operator.full_name}
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
