"use client";

import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
// import { useSelector, useDispatch } from "react-redux";
import { buildingsAPI, propertiesAPI } from "../../../lib/api";
import { Property } from "../../../types";

interface Building {
  id: string;
  name: string;
  address: string;
  number_of_units: number;
  type_of_unit: string[];
  logo?: string;
  video?: string;
  photos?: string[];
  documents?: string;
  operator_id: string | null;
  amenities?: string[];
  districts?: Array<{ label: string; destination?: number }>;
  areas?: Array<{ label: string; destination?: number }>;
  commute_times?: Array<{
    label: string;
    destination?: number;
    method?: string;
  }>;
}
// import {
//   addToShortlist,
//   removeFromShortlist,
//   selectShortlistProperties,
// } from "../../../store/slices/shortlistSlice";
// import { AppDispatch } from "../../../store/store";
// import {
//   selectUser,
//   selectIsAuthenticated,
// } from "../../../store/slices/authSlice";
import ImageGallery from "../../../components/ImageGallery";
import { Button } from "@/shared/ui/Button/Button";
import { Share, ChevronLeft, ChevronRight } from "lucide-react";
import TenantUniversalHeader from "../../../components/TenantUniversalHeader";
import PropertyDetailSkeleton from "../../../components/ui/PropertyDetailSkeleton";
import EnhancedPropertyCard from "../../../components/EnhancedPropertyCard";
import toast from "react-hot-toast";

type BuildingWithMedia = Building & {
  media?: Array<{
    id: string;
    url: string;
    type: "video" | "image";
    order_index: number;
    property_id: string;
    mime_type: string;
    original_filename: string;
    file_size: number;
    uploaded_at: string;
    created_at: string;
    updated_at: string;
    is_featured?: boolean;
    room_type?: string;
  }>;
};

export default function BuildingPublicPage() {
  const params = useParams();
  const id = params && typeof params.id === "string" ? params.id : null;
  const router = useRouter();
  // const dispatch = useDispatch<AppDispatch>();
  // const user = useSelector(selectUser);
  // const isAuthenticated = useSelector(selectIsAuthenticated);

  const [building, setBuilding] = useState<BuildingWithMedia | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllOffers, setShowAllOffers] = useState(false);

  // Scroll to top when component mounts
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Fetch building data
  useEffect(() => {
    const fetchBuilding = async () => {
      if (!id || typeof id !== "string") {
        setError("Invalid building ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await buildingsAPI.getByIdPublic(id);
        setBuilding(response.data || response);
      } catch (err: any) {
        console.error("Error fetching building:", err);
        setError(err.message || "Failed to load building");
      } finally {
        setLoading(false);
      }
    };

    fetchBuilding();
  }, [id]);

  // Fetch building properties
  useEffect(() => {
    const fetchProperties = async () => {
      if (!id || typeof id !== "string") return;

      try {
        setPropertiesLoading(true);
        const response = await propertiesAPI.getAllPublic({ building_id: id });
        const propertiesData = response.data?.data || response.data || [];
        setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      } catch (err: any) {
        console.error("Error fetching building properties:", err);
      } finally {
        setPropertiesLoading(false);
      }
    };

    fetchProperties();
  }, [id]);

  // Get all images for gallery
  const allImages = useMemo(() => {
    const images: string[] = [];

    if (building?.media && building.media.length > 0) {
      building.media
        .filter((item) => item.type === "image" || !item.type)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .forEach((item) => {
          if (item.url) images.push(item.url);
        });
    }

    if (building?.photos && building.photos.length > 0) {
      building.photos.forEach((photo) => {
        if (photo && !images.includes(photo)) {
          images.push(photo);
        }
      });
    }

    return images;
  }, [building]);

  // Format amenities
  const formatAmenityName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get amenities to display
  const displayedAmenities = useMemo(() => {
    if (!building?.amenities || building.amenities.length === 0) return [];

    const amenities = building.amenities.map(formatAmenityName);
    return showAllOffers ? amenities : amenities.slice(0, 9);
  }, [building?.amenities, showAllOffers]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: building?.name || "Building",
          text: `Check out this building: ${building?.name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link");
      }
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/app/properties/${propertyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader />
        <PropertyDetailSkeleton />
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader />
        <div className="max-w-[92%] mx-auto px-1 sm:px-1.5 lg:px-2 py-2">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Building not found
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "The building you're looking for doesn't exist."}
            </p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader />

      {/* Building Header */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {building.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {building.address}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 sm:gap-0.75">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-0.5"
            >
              <Share className="w-1.25 h-1.25" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content: gallery + details */}
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          {/* Gallery */}
          {allImages.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <ImageGallery
                media={building.media || []}
                images={allImages}
                alt={building.name || "Building"}
              />
            </div>
          )}

          {/* About building */}
          <section className="py-4 sm:py-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              About building
            </h2>
            <div className="text-sm sm:text-base text-black leading-relaxed">
              <p>
                {building.name} — это{" "}
                {building.type_of_unit?.join(", ").toLowerCase() ||
                  "апартаменты"}{" "}
                в центре города Лондон, расположенные в {building.address}.
                {building.number_of_units &&
                  ` В здании ${building.number_of_units} единиц.`}
                {building.amenities?.includes("concierge") &&
                  " Среди удобств есть консьерж-зона и бесплатный Wi-Fi."}
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-medium mt-0.5 text-sm">
                More information
              </button>
            </div>
          </section>

          {/* What this place offers */}
          {displayedAmenities.length > 0 && (
            <section className="py-4 sm:py-6 border-t border-gray-200">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                What this place offers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {displayedAmenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-1 py-0.5">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                    <span className="text-sm sm:text-base text-black">
                      {amenity}
                    </span>
                  </div>
                ))}
              </div>
              {building.amenities && building.amenities.length > 9 && (
                <button
                  onClick={() => setShowAllOffers(!showAllOffers)}
                  className="mt-1 px-1.5 py-0.75 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {showAllOffers
                    ? "Show less"
                    : `See all offers (${building.amenities.length})`}
                </button>
              )}
            </section>
          )}

          {/* Listed properties */}
          {properties.length > 0 && (
            <section className="py-4 sm:py-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Listed property
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    After you log in, our service gives you the best results
                    tailored to your preferences
                    <span className="ml-1 text-gray-900 font-medium">
                      • {properties.length} items
                    </span>
                  </p>
                </div>

                {properties.length > 3 && (
                  <div className="flex items-center gap-0.5">
                    <button className="p-0.75 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors">
                      <ChevronLeft className="w-1.25 h-1.25" />
                    </button>
                    <button className="p-0.75 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors">
                      <ChevronRight className="w-1.25 h-1.25" />
                    </button>
                  </div>
                )}
              </div>

              {propertiesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-1.5">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 rounded-lg h-80 animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-1.5">
                  {properties.slice(0, 3).map((property) => (
                    <EnhancedPropertyCard
                      key={property.id}
                      property={property}
                      matchScore={0}
                      onClick={() => handlePropertyClick(property.id)}
                      showShortlist={true}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Building location */}
          <section className="py-4 sm:py-6 border-t border-gray-200">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Building location
            </h2>
            <p className="text-sm sm:text-base text-black">
              {building.address}
            </p>
          </section>

          {/* Transport and placements */}
          <section className="py-4 sm:py-6 border-t border-gray-200">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
              Transport and placements
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Location and date */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Location and date
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Primary postcode
                    </p>
                    <p className="text-sm font-medium text-black">
                      {(() => {
                        if (!building.address) return "N/A";
                        // Try to extract UK postcode (format: SW1A 1AA or SW1A1AA)
                        const postcodeMatch = building.address.match(
                          /[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i
                        );
                        if (postcodeMatch)
                          return postcodeMatch[0].toUpperCase();
                        // Fallback to first part of address
                        return building.address.split(",")[0]?.trim() || "N/A";
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Commute location
                    </p>
                    <p className="text-sm font-medium text-black">
                      {building.districts && building.districts.length > 0
                        ? typeof building.districts[0] === "string"
                          ? building.districts[0]
                          : building.districts[0]?.label
                        : building.areas && building.areas.length > 0
                        ? typeof building.areas[0] === "string"
                          ? building.areas[0]
                          : building.areas[0]?.label
                        : "Central London"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Secondary location (option)
                    </p>
                    <p className="text-sm font-medium text-black">
                      {building.districts && building.districts.length > 1
                        ? typeof building.districts[1] === "string"
                          ? building.districts[1]
                          : building.districts[1]?.label
                        : building.areas && building.areas.length > 1
                        ? typeof building.areas[1] === "string"
                          ? building.areas[1]
                          : building.areas[1]?.label
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Move-in Date</p>
                    <p className="text-sm font-medium text-black">N/A</p>
                  </div>
                </div>
              </div>

              {/* Budget range */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Budget range
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Minimum (£/Month)
                    </p>
                    <p className="text-sm font-medium text-black">
                      {(() => {
                        const pricesWithValues = properties
                          .filter((p) => p.price && p.price > 0)
                          .map((p) => p.price!);
                        return pricesWithValues.length > 0
                          ? Math.min(...pricesWithValues).toLocaleString()
                          : "N/A";
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Maximum (£/Month)
                    </p>
                    <p className="text-sm font-medium text-black">
                      {(() => {
                        const pricesWithValues = properties
                          .filter((p) => p.price && p.price > 0)
                          .map((p) => p.price!);
                        return pricesWithValues.length > 0
                          ? Math.max(...pricesWithValues).toLocaleString()
                          : "N/A";
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Maximum commute time */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Maximum commute time
                </h3>
                <div className="space-y-2">
                  {building.commute_times &&
                  building.commute_times.length > 0 ? (
                    <>
                      {building.commute_times.find((ct) =>
                        ct.label.toLowerCase().includes("walk")
                      ) && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Walking (minutes)
                          </p>
                          <p className="text-sm font-medium text-black">
                            {building.commute_times.find((ct) =>
                              ct.label.toLowerCase().includes("walk")
                            )?.destination || "N/A"}
                          </p>
                        </div>
                      )}
                      {building.commute_times.find((ct) =>
                        ct.label.toLowerCase().includes("cycl")
                      ) && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Cycling (minutes)
                          </p>
                          <p className="text-sm font-medium text-black">
                            {building.commute_times.find((ct) =>
                              ct.label.toLowerCase().includes("cycl")
                            )?.destination || "N/A"}
                          </p>
                        </div>
                      )}
                      {building.commute_times.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Secondary location
                          </p>
                          <p className="text-sm font-medium text-black">
                            {building.commute_times[0]?.label || "N/A"}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Walking (minutes)
                        </p>
                        <p className="text-sm font-medium text-black">N/A</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Cycling (minutes)
                        </p>
                        <p className="text-sm font-medium text-black">N/A</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Move-in Date</p>
                    <p className="text-sm font-medium text-black">N/A</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
