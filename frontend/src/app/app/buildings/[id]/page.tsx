"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
// import { useSelector, useDispatch } from "react-redux";
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
import { DetailsCard } from "@/shared/ui/DetailsCard";
import { notify } from "@/shared/lib/notify";
import Footer from "../../../components/Footer";
import { usePropertyMatches } from "../../../hooks/usePropertyMatches";
import {
  useGetPublicBuildingQuery,
  useGetPublicBuildingPropertiesQuery,
} from "../../../store/slices/apiSlice";

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
  const [error, setError] = useState<string | null>(null);
  const [showAllOffers, setShowAllOffers] = useState(false);

  // Load building via RTK Query (with cache across navigations)
  const {
    data: buildingData,
    isLoading: isBuildingLoading,
    isFetching: isBuildingFetching,
    error: buildingError,
  } = useGetPublicBuildingQuery(id as string, {
    skip: !id,
  });

  const building: BuildingWithMedia | null = useMemo(() => {
    if (!buildingData) return null;
    const normalized = (buildingData as any).data || buildingData;
    return normalized as BuildingWithMedia;
  }, [buildingData]);

  // Load building properties via RTK Query (also cached)
  const {
    data: propertiesData,
    isLoading: isPropsLoading,
    isFetching: isPropsFetching,
  } = useGetPublicBuildingPropertiesQuery(
    { building_id: id as string },
    { skip: !id },
  );

  const properties: Property[] = useMemo(() => {
    if (!propertiesData) return [];
    const raw = (propertiesData as any).data || propertiesData;
    return Array.isArray(raw) ? (raw as Property[]) : [];
  }, [propertiesData]);

  // Derive error from RTK Query
  useEffect(() => {
    if (!buildingError) return;
    const err = buildingError as any;
    const message =
      err?.data?.message ||
      err?.error ||
      (typeof err?.message === "string" ? err.message : undefined);
    setError(message || "Failed to load building");
  }, [buildingError]);

  const priceStats = useMemo(() => {
    const prices = properties
      .map((p) => p.price)
      .filter(
        (price): price is number => typeof price === "number" && price > 0,
      );

    if (prices.length === 0) {
      return { min: null as number | null, max: null as number | null };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [properties]);

  const displayedPropertyIds = useMemo(
    () => properties.slice(0, 3).map((p) => p.id),
    [properties],
  );
  const { matchByPropertyId } = usePropertyMatches(displayedPropertyIds);

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
        notify.success("Link copied to clipboard!");
      } catch (err) {
        notify.error("Failed to copy link");
      }
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/app/properties/${propertyId}`);
  };

  // Основной скелетон показываем только на самом первом запросе,
  // когда нет ни building, ни данных из кэша.
  if ((isBuildingLoading && !building) || (isBuildingFetching && !building)) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader />
        <div className="pt-24 sm:pt-28 lg:pt-32">
          <PropertyDetailSkeleton />
        </div>
        <Footer />
      </div>
    );
  }

  // "not found" / ошибка — только когда нет building и запрос не в процессе
  if ((error || !building) && !isBuildingLoading && !isBuildingFetching) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader />
        <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-32 pb-8">
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TenantUniversalHeader />

      {/* Building Header */}
      <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-32 pb-8">
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
      <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          {/* Gallery — same width as page container */}
          {allImages.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <ImageGallery
                media={building.media || []}
                images={allImages}
                alt={building.name || "Building"}
              />
            </div>
          )}

          {/* Details summary under gallery, same container width */}
          <div className="w-full">
            <DetailsCard
              title="Details"
              titleSize="compact"
              showDividers={true}
              align="center"
              gridClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6"
              items={[
                {
                  label: "Price from",
                  value:
                    priceStats.min !== null
                      ? `£${priceStats.min.toLocaleString()} pcm`
                      : "N/A",
                },
                {
                  label: "Property type",
                  value: building.type_of_unit?.length
                    ? building.type_of_unit.join(", ")
                    : "N/A",
                },
                {
                  label: "Units",
                  value: building.number_of_units
                    ? building.number_of_units.toLocaleString()
                    : "N/A",
                },
                {
                  label: "Amenities",
                  value: building.amenities?.length
                    ? `${building.amenities.length} items`
                    : "N/A",
                },
                {
                  label: "Listed",
                  value: properties.length
                    ? `${properties.length} items`
                    : "N/A",
                },
              ]}
            />
          </div>

          {/* About building */}
          <section className="py-4 sm:py-6 w-full">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              About building
            </h2>
            <div className="text-sm sm:text-base text-black leading-relaxed">
              <p>
                {building.name} — это{" "}
                {building.type_of_unit && building.type_of_unit.length
                  ? building.type_of_unit.join(", ").toLowerCase()
                  : "апартаменты"}{" "}
                в центре города Лондон, расположенные в {building.address}.
                {building.number_of_units &&
                  ` В здании ${building.number_of_units} единиц.`}
                {building.amenities?.includes("concierge") &&
                  " Среди удобств есть консьерж-зона и бесплатный Wi-Fi."}
              </p>
              <button className="text-black cursor-pointer hover:text-gray-700 font-medium mt-0.5 text-sm">
                More information
              </button>
            </div>
          </section>

          {/* What this place offers */}
          {displayedAmenities.length > 0 && (
            <section className="py-4 sm:py-6 w-full">
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
                  className="mt-3 cursor-pointer px-4 py-2 text-black border border-gray-300 rounded-3xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {showAllOffers
                    ? "Show less"
                    : `See more (${building.amenities.length})`}
                </button>
              )}
            </section>
          )}

          {/* Listed properties */}
          {properties.length > 0 && (
            <section className="py-4 sm:py-6 w-full">
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

              {isPropsLoading && !properties.length ? (
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
                  {properties.slice(0, 3).map((property) => {
                    const match = matchByPropertyId[property.id];
                    return (
                      <EnhancedPropertyCard
                        key={property.id}
                        property={property}
                        matchScore={match?.matchScore}
                        matchCategories={match?.matchCategories}
                        onClick={() => handlePropertyClick(property.id)}
                        showShortlist={true}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Building location */}
          <section className="py-4 sm:py-6 w-full">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Building location
            </h2>
            <p className="text-sm sm:text-base text-black">
              {building.address}
            </p>
          </section>

          {/* Transport and placements */}
          <section className="py-4 sm:py-10 w-full">
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
                          /[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i,
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
                      {priceStats.min !== null
                        ? priceStats.min.toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Maximum (£/Month)
                    </p>
                    <p className="text-sm font-medium text-black">
                      {priceStats.max !== null
                        ? priceStats.max.toLocaleString()
                        : "N/A"}
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
                        ct.label.toLowerCase().includes("walk"),
                      ) && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Walking (minutes)
                          </p>
                          <p className="text-sm font-medium text-black">
                            {building.commute_times.find((ct) =>
                              ct.label.toLowerCase().includes("walk"),
                            )?.destination || "N/A"}
                          </p>
                        </div>
                      )}
                      {building.commute_times.find((ct) =>
                        ct.label.toLowerCase().includes("cycl"),
                      ) && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Cycling (minutes)
                          </p>
                          <p className="text-sm font-medium text-black">
                            {building.commute_times.find((ct) =>
                              ct.label.toLowerCase().includes("cycl"),
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
      <Footer />
    </div>
  );
}
