"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
// import { useSelector, useDispatch } from "react-redux";
import { Property } from "../../../types";
import { waitForSessionManager } from "../../../components/providers/SessionManager";

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
  metro_stations?: Array<{ label: string; destination?: number }>;
  commute_times?: Array<{
    label: string;
    destination?: number;
    method?: string;
  }>;
}
import ImageGallery from "../../../components/ImageGallery";
import { Button } from "@/shared/ui/Button/Button";
import { Share, ChevronLeft, ChevronRight, Home, Train } from "lucide-react";
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
  useGetPreferencesQuery,
} from "../../../store/slices/apiSlice";
import { hasPreferencesLocationFilled } from "@/entities/preferences/model/preferences";
import { useTranslation } from "../../../hooks/useTranslation";
import { listingPropertyKeys } from "@/app/lib/translationsKeys/listingPropertyTranslationKeys";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";

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
  const { t } = useTranslation();
  const params = useParams();
  const id = params && typeof params.id === "string" ? params.id : null;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        await waitForSessionManager();
      } catch {
        // ignore; if session bootstrap fails, request will still run
      } finally {
        if (isMounted) {
          setSessionReady(true);
        }
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const { data: preferencesQueryData } = useGetPreferencesQuery(undefined, {
    skip: !sessionReady,
  });

  const preferencesFilledCount = useMemo(() => {
    const preferences = (
      preferencesQueryData &&
      typeof preferencesQueryData === "object" &&
      "data" in preferencesQueryData
        ? (preferencesQueryData as { data?: Record<string, unknown> }).data
        : preferencesQueryData
    ) as Record<string, unknown> | undefined;

    if (!preferences || typeof preferences !== "object") {
      return 0;
    }

    let filledCount = 0;
    if (hasPreferencesLocationFilled(preferences)) filledCount += 1;
    if (preferences.min_price != null || preferences.max_price != null)
      filledCount += 1;
    if (preferences.min_bedrooms != null) filledCount += 1;
    if (preferences.furnishing) filledCount += 1;
    if (preferences.let_duration) filledCount += 1;
    if (
      preferences.designer_furniture !== undefined &&
      preferences.designer_furniture !== null
    )
      filledCount += 1;
    if (preferences.ideal_living_environment) filledCount += 1;
    if (preferences.pets) filledCount += 1;
    if (preferences.smoker !== undefined && preferences.smoker !== null)
      filledCount += 1;
    if (preferences.move_in_date) filledCount += 1;
    if (preferences.max_bedrooms != null) filledCount += 1;
    if (preferences.min_bathrooms != null || preferences.max_bathrooms != null)
      filledCount += 1;
    if (Array.isArray(preferences.hobbies) && preferences.hobbies.length > 0)
      filledCount += 1;
    if (preferences.additional_info) filledCount += 1;

    return filledCount;
  }, [preferencesQueryData]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

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

  const preferredAreas = useMemo(() => {
    const raw = (building as any)?.areas;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const labels = raw
      .map((a: any) => (typeof a === "string" ? a : a?.label))
      .filter(Boolean);
    return labels.length > 0 ? labels.join(", ") : null;
  }, [building]);

  const preferredDistricts = useMemo(() => {
    const raw = (building as any)?.districts;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const labels = raw
      .map((d: any) => (typeof d === "string" ? d : d?.label))
      .filter(Boolean);
    return labels.length > 0 ? labels.join(", ") : null;
  }, [building]);

  const preferredMetro = useMemo(() => {
    let raw =
      (building as any)?.metro_stations ??
      (building as any)?.metroStations ??
      (building as any)?.commute_times ??
      (building as any)?.commuteTimes;

    // Sometimes backends can return JSON columns as strings; handle safely.
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        // keep raw as-is
      }
    }

    if (!Array.isArray(raw) || raw.length === 0) return null;

    const labels = raw
      .map((m: any) => {
        if (typeof m === "string") return m;
        if (!m || typeof m !== "object") return null;
        return (
          (typeof m.label === "string" ? m.label : null) ??
          (typeof m.name === "string" ? m.name : null) ??
          (typeof m.station === "string" ? m.station : null)
        );
      })
      .filter(
        (v: unknown): v is string => typeof v === "string" && v.length > 0,
      );

    return labels.length > 0 ? labels.join(", ") : null;
  }, [building]);

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
    router.push(`/app/properties/${propertyId}`, { scroll: true });
  };

  // Основной скелетон показываем только на самом первом запросе,
  // когда нет ни building, ни данных из кэша.
  if ((isBuildingLoading && !building) || (isBuildingFetching && !building)) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader preferencesCount={preferencesFilledCount} />
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
        <TenantUniversalHeader preferencesCount={preferencesFilledCount} />
        <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-32 pb-16">
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
      <TenantUniversalHeader preferencesCount={preferencesFilledCount} />

      {/* Building Header */}
      <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-32 pb-6 sm:pb-8 lg:pb-10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {building.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {building.address}
            </p>
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
              title={t("listing.building.details.sectionTitle")}
              titleSize="large"
              showDividers={true}
              align="center"
              gridClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6"
              items={[
                {
                  label: t(wizardKeys.step2.budget.from),
                  value:
                    priceStats.min !== null
                      ? `£${priceStats.min.toLocaleString()} pcm`
                      : "N/A",
                },
                {
                  label: t(wizardKeys.step3.des.text1),
                  value: building.type_of_unit?.length
                    ? building.type_of_unit.join(", ")
                    : "N/A",
                },
                {
                  label: t("building.details.units"),
                  value: building.number_of_units
                    ? building.number_of_units.toLocaleString()
                    : "N/A",
                },
                {
                  label: t("wizard.step7.title"),
                  value: building.amenities?.length
                    ? `${building.amenities.length} items`
                    : "N/A",
                },
                {
                  label: t("building.details.availableUnits"),
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
              {t(listingPropertyKeys.keyFeatures.sectionTitle)}
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
            </div>
          </section>

          {/* What this place offers */}
          {displayedAmenities.length > 0 && (
            <section className="py-4 sm:py-6 w-full">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                {t("building.details.situated")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-1">
                {displayedAmenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 sm:gap-3 py-2"
                  >
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
                  className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 cursor-pointer rounded-3xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
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
                    {t("building.details.availableUnits")}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    {t("building.listings.subtitle")}{" "}
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
              {t("building.details.situated")}
            </h2>
            <p className="text-sm sm:text-base text-black">
              {building.address}
            </p>
          </section>

          {/* Transport and placements */}
          <section className="py-4 sm:py-10 mb-8 w-full">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
              {t("building.location.whatsAround")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Location and date */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  {t("preferences.location")}
                </h3>
                <div className="space-y-2">
                  {preferredAreas ? (
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">
                          {t(wizardKeys.step1.areas)}
                        </p>
                        <p className="text-sm font-medium text-black">
                          {preferredAreas}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {preferredDistricts ? (
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">
                          {t(wizardKeys.step1.districts)}
                        </p>
                        <p className="text-sm font-medium text-black">
                          {preferredDistricts}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {preferredMetro ? (
                    <div className="flex items-start gap-2">
                      <Train className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">
                          {t(wizardKeys.step1.metro.station)}
                        </p>
                        <p className="text-sm font-medium text-black">
                          {preferredMetro}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Budget range */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 mt-4 lg:mt-0">
                  {t("preferences.budgetRange")}
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {t(wizardKeys.step2.budget.from)} (£/Month)
                    </p>
                    <p className="text-sm font-medium text-black">
                      {priceStats.min !== null
                        ? priceStats.min.toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {t(wizardKeys.step2.budget.to)} (£/Month)
                    </p>
                    <p className="text-sm font-medium text-black">
                      {priceStats.max !== null
                        ? priceStats.max.toLocaleString()
                        : "N/A"}
                    </p>
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
