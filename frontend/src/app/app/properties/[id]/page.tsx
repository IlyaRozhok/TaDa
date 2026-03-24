"use client";

import React, { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  matchingAPI,
  bookingRequestsAPI,
  CategoryMatchResult,
} from "../../../lib/api";
import type { Property, PropertyMedia } from "../../../types";
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
import {
  useGetPublicPropertyQuery,
  useGetPublicBuildingQuery,
  useGetPreferencesQuery,
} from "../../../store/slices/apiSlice";
import ImageGallery from "../../../components/ImageGallery";
import { Button } from "@/shared/ui/Button/Button";
import { Heart, Share } from "lucide-react";
import TenantUniversalHeader from "../../../components/TenantUniversalHeader";
import BuildingPropertiesSection from "../../../components/BuildingPropertiesSection";
import PreferencePropertiesSection from "../../../components/PreferencePropertiesSection";
import PropertyDetailSkeleton from "../../../components/ui/PropertyDetailSkeleton";
import { DetailsCard } from "@/shared/ui/DetailsCard";
import { MatchBadgeTooltip } from "@/entities/property/ui/MatchBadgeTooltip";
import { notify } from "@/shared/lib/notify";
import PhoneMaskInput from "@/shared/ui/PhoneMaskInput/PhoneMaskInput";
import {
  getCountryByCode,
  getCountryByDialCode,
  getDefaultCountry,
} from "@/shared/lib/countries";
import { InputField } from "@/app/components/preferences/ui/InputField";
import Footer from "../../../components/Footer";
import { useTranslation } from "../../../hooks/useTranslation";
import {
  listingPropertyKeys,
  listingNotificationKeys,
  propertyDetailsKeys,
} from "@/app/lib/translationsKeys/listingPropertyTranslationKeys";
import { wizardKeys } from "@/app/lib/translationsKeys/wizardTranslationKeys";
import { generalKeys } from "@/app/lib/translationsKeys/generalKeys";
import { DateInput } from "@/shared/ui/DateInput/DateInput";
import {
  getBuildingTypeTranslationKey,
  getPropertyTypeTranslationKey,
  getFurnishingTranslationKey,
} from "@/shared/constants/mappings";
import { waitForSessionManager } from "../../../components/providers/SessionManager";

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
  const { t } = useTranslation();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const shortlistProperties = useSelector(selectShortlistProperties);
  const [error, setError] = useState<string | null>(null);
  const [isInShortlist, setIsInShortlist] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchCategories, setMatchCategories] = useState<CategoryMatchResult[]>(
    [],
  );
  const [bookingLoading, setBookingLoading] = useState(false);
  const [hasBookingRequest, setHasBookingRequest] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingInlineError, setBookingInlineError] = useState<string | null>(
    null,
  );
  const [bookingSubmitError, setBookingSubmitError] = useState<string | null>(
    null,
  );
  const [bookingPhoneCountryCode, setBookingPhoneCountryCode] = useState("GB");
  const [bookingPhoneNumberOnly, setBookingPhoneNumberOnly] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingNameError, setBookingNameError] = useState<string | undefined>(
    undefined,
  );
  const [bookingPhoneError, setBookingPhoneError] = useState<
    string | undefined
  >(undefined);
  const [bookingEmailError, setBookingEmailError] = useState<
    string | undefined
  >(undefined);
  const [bookingMoveInDate, setBookingMoveInDate] = useState<string | null>(
    null,
  );
  const [bookingMoveOutDate, setBookingMoveOutDate] = useState<string | null>(
    null,
  );
  const [bookingDescription, setBookingDescription] = useState("");
  const [redirecting429, setRedirecting429] = useState(false);
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
    if (preferences.primary_postcode) filledCount += 1;
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
    if (preferences.house_shares) filledCount += 1;
    if (
      Array.isArray(preferences.convenience_features) &&
      preferences.convenience_features.length > 0
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
    if (preferences.date_property_added) filledCount += 1;

    return filledCount;
  }, [preferencesQueryData]);

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
  }, [id]);

  // Load property via RTK Query (with cache across navigations)
  const {
    data: propertyData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetPublicPropertyQuery(id as string, {
    skip: !id,
  });

  // Normalize property data directly from RTK Query (no промежуточного null-состояния)
  const property: PropertyWithMedia | null = useMemo(() => {
    if (!propertyData) return null;
    const normalized = (propertyData as any).data || propertyData;
    return normalized as PropertyWithMedia;
  }, [propertyData]);

  // Load building media for gallery (append building photos after property photos)
  const { data: buildingData } = useGetPublicBuildingQuery(
    property?.building?.id as string,
    {
      skip: !property?.building?.id,
    },
  );

  const buildingWithMedia = useMemo(() => {
    if (!buildingData) return null;
    const normalized = (buildingData as any).data || buildingData;
    return normalized as {
      media?: Array<{
        id: string;
        url: string;
        type?: "video" | "image";
        order_index?: number;
      }>;
      photos?: string[];
    };
  }, [buildingData]);

  // Handle errors (including 429) from RTK Query
  useEffect(() => {
    if (!queryError) return;

    // RTK Query error can be FetchBaseQueryError | SerializedError
    const err = queryError as any;
    const status =
      typeof err?.status === "number"
        ? err.status
        : (err?.data?.statusCode ?? err?.originalStatus);
    const message =
      err?.data?.message ||
      err?.error ||
      (typeof err?.message === "string" ? err.message : undefined);

    const is429 =
      status === 429 || (message && String(message).includes("429"));

    if (is429) {
      notify.error("Too many requests. Please try again later.");
      setRedirecting429(true);
      return;
    }

    setError(message || "Failed to load property details");
  }, [queryError]);

  // Redirect to properties list when rate-limited (429), after showing toast
  useEffect(() => {
    if (!redirecting429) return;
    const t = setTimeout(() => {
      router.push("/app/units", { scroll: true });
      setRedirecting429(false);
    }, 100);
    return () => clearTimeout(t);
  }, [redirecting429, router]);

  // Load existing booking request for this tenant/property
  useEffect(() => {
    const loadBookingRequest = async () => {
      if (
        !isAuthenticated ||
        !user ||
        (user.role !== "tenant" && user.role !== "admin") ||
        !id
      ) {
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
      if (
        !id ||
        !isAuthenticated ||
        !user ||
        (user.role !== "tenant" && user.role !== "admin")
      ) {
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
    if (
      !property ||
      !isAuthenticated ||
      !user ||
      (user.role !== "tenant" && user.role !== "admin")
    ) {
      setIsInShortlist(false);
      return;
    }

    // Check if current property is in shortlist from Redux state
    const isPropertyInShortlist = shortlistProperties.some(
      (shortlistProperty) => shortlistProperty.id === property.id,
    );
    setIsInShortlist(isPropertyInShortlist);
  }, [property, isAuthenticated, user, shortlistProperties]);

  const buildingGalleryImages: string[] = useMemo(() => {
    const images: string[] = [];

    if (buildingWithMedia?.media && buildingWithMedia.media.length > 0) {
      buildingWithMedia.media
        .filter((item) => item.type === "image" || !item.type)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .forEach((item) => {
          if (item.url) images.push(item.url);
        });
    }

    if (buildingWithMedia?.photos && buildingWithMedia.photos.length > 0) {
      buildingWithMedia.photos.forEach((photo) => {
        if (photo && !images.includes(photo)) {
          images.push(photo);
        }
      });
    }

    return images;
  }, [buildingWithMedia]);

  const propertyLegacyImages: string[] = useMemo(() => {
    if (!property) return [];
    return [...(property.images || []), ...(property.photos || [])];
  }, [property]);

  const combinedLegacyImages: string[] = useMemo(
    () => [...propertyLegacyImages, ...buildingGalleryImages],
    [propertyLegacyImages, buildingGalleryImages],
  );

  const combinedMedia: PropertyMedia[] = useMemo(() => {
    const baseMedia = property?.media || [];

    if (!buildingWithMedia?.media || buildingWithMedia.media.length === 0) {
      return baseMedia;
    }

    const maxOrderIndex =
      baseMedia.length > 0
        ? Math.max(...baseMedia.map((m) => m.order_index || 0))
        : 0;

    const buildingMediaAsProperty: PropertyMedia[] = buildingWithMedia.media
      .filter((item) => item.type === "image" || !item.type)
      .map((item, index) => ({
        id: item.id,
        property_id: property?.id || "",
        url: item.url,
        s3_url: undefined,
        type: "image",
        mime_type: "",
        original_filename: "",
        file_size: 0,
        order_index: (item.order_index ?? maxOrderIndex + index + 1) || 0,
        is_featured: false,
        created_at: "",
        updated_at: "",
      }));

    return [...baseMedia, ...buildingMediaAsProperty];
  }, [property?.media, property?.id, buildingWithMedia]);

  const allImages: string[] = useMemo(() => {
    if (!property && buildingGalleryImages.length === 0) {
      return [];
    }

    const mediaArray = combinedMedia || [];

    const mediaUrls = mediaArray
      .map((m: PropertyMedia) => m.url)
      .filter(Boolean);

    const allUrls = [...mediaUrls, ...combinedLegacyImages];

    // Only return real images, no fallbacks
    return allUrls;
  }, [property, combinedMedia, combinedLegacyImages, buildingGalleryImages]);

  const handleShortlistToggle = async () => {
    if (!isAuthenticated || !user) {
      notify.error("Please login to add properties to shortlist");
      return;
    }

    if (user.role !== "tenant" && user.role !== "admin") {
      notify.error("Only tenants and admins can add properties to shortlist");
      return;
    }

    setShortlistLoading(true);
    try {
      if (isInShortlist) {
        // Use Redux action instead of direct API call
        await dispatch(removeFromShortlist(id as string)).unwrap();
        setIsInShortlist(false);
      } else {
        // Use Redux action instead of direct API call
        await dispatch(
          addToShortlist({
            propertyId: id as string,
            property: property || undefined,
          }),
        ).unwrap();
        setIsInShortlist(true);
      }
    } catch (error: unknown) {
      // Keep error logging for errors, as per best practice
      // But if you want to remove all console usage, comment out the next line:
      // console.error("Shortlist error:", error);
      notify.error((error as Error)?.message || "Failed to update shortlist");
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleBookApartment = () => {
    if (!property) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    if (user.role !== "tenant" && user.role !== "admin") {
      setBookingInlineError(
        "Only tenant and admin accounts can book apartments",
      );
      return;
    }

    setBookingInlineError(null);
    setBookingSubmitError(null);
    const profileName =
      user?.full_name ||
      user?.tenantProfile?.full_name ||
      user?.operatorProfile?.full_name ||
      "";
    const profilePhone =
      user?.tenantProfile?.phone || user?.operatorProfile?.phone || "";

    const normalizedPhone = profilePhone.trim();
    const dialCodeMatch = normalizedPhone.match(/^\+\d{1,4}/);
    const matchedCountry = dialCodeMatch
      ? getCountryByDialCode(dialCodeMatch[0])
      : undefined;
    const nextCountryCode = matchedCountry?.code || "GB";
    const numberOnly = normalizedPhone
      .replace(/^\+\d{1,4}\s*/, "")
      .replace(/[^\d]/g, "");
    const countryDialCode =
      getCountryByCode(nextCountryCode)?.dialCode ||
      getDefaultCountry().dialCode;
    const fullPhone = numberOnly
      ? `${countryDialCode} ${numberOnly}`.trim()
      : normalizedPhone;

    setBookingName(profileName.trim());
    setBookingPhoneCountryCode(nextCountryCode);
    setBookingPhoneNumberOnly(numberOnly);
    setBookingPhone(fullPhone);
    setBookingEmail(user?.email?.trim() || "");
    setBookingNameError(undefined);
    setBookingPhoneError(undefined);
    setBookingEmailError(undefined);
    setBookingMoveInDate(null);
    setBookingMoveOutDate(null);
    setBookingDescription("");
    setIsBookingModalOpen(true);
  };

  const handleSendBookingRequest = async () => {
    if (!property) {
      return;
    }

    const name = bookingName.trim();
    const email = bookingEmail.trim();
    const phoneDigits = bookingPhone.replace(/\D/g, "");
    const hasPhone = phoneDigits.length > 0;

    setBookingNameError(undefined);
    setBookingPhoneError(undefined);
    setBookingEmailError(undefined);
    setBookingSubmitError(null);

    if (!name) {
      setBookingNameError("Please enter your name");
      return;
    }

    if (!email && !hasPhone) {
      const message = "Please enter your email or phone number";
      setBookingPhoneError(message);
      setBookingEmailError(message);
      return;
    }

    if (email) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isValidEmail) {
        setBookingEmailError("Please enter a valid email address");
        return;
      }
    }

    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    if (
      bookingMoveInDate === "INVALID_FORMAT" ||
      bookingMoveOutDate === "INVALID_FORMAT"
    ) {
      setBookingSubmitError("Please enter valid dates (DD.MM.YYYY)");
      return;
    }
    const dateFrom =
      bookingMoveInDate && isoDate.test(bookingMoveInDate)
        ? bookingMoveInDate
        : undefined;
    const dateTo =
      bookingMoveOutDate && isoDate.test(bookingMoveOutDate)
        ? bookingMoveOutDate
        : undefined;
    if (bookingMoveInDate && !dateFrom) {
      setBookingSubmitError("Please enter a valid move-in date");
      return;
    }
    if (bookingMoveOutDate && !dateTo) {
      setBookingSubmitError("Please enter a valid move-out date");
      return;
    }

    try {
      setBookingLoading(true);
      await bookingRequestsAPI.create(property.id, {
        email: email || undefined,
        phone_number: hasPhone ? bookingPhone.trim() : undefined,
        date_from: dateFrom,
        date_to: dateTo,
        description: bookingDescription.trim() || undefined,
      });
      setHasBookingRequest(true);
      setIsBookingModalOpen(false);
      notify.success(t(listingNotificationKeys.viewingRequestSentMessage));
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send booking request";
      setBookingSubmitError(message);
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    if (!isBookingModalOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsBookingModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    // Prevent layout shift caused by scrollbar disappearance.
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isBookingModalOpen]);

  const isBookingSubmitDisabled =
    bookingLoading ||
    hasBookingRequest ||
    !bookingName.trim() ||
    (!bookingEmail.trim() && bookingPhone.replace(/\D/g, "").length === 0) ||
    !bookingMoveInDate ||
    !bookingMoveOutDate;

  // Skeleton: показываем только при первом загрузочном запросе (isLoading)
  // При возврате назад из кэша будет isFetching, но isLoading=false — скелетон не показываем.
  if ((isLoading && !property) || redirecting429) {
    return (
      <div className="min-h-screen bg-white">
        <TenantUniversalHeader
          showPreferencesButton={true}
          preferencesCount={preferencesFilledCount}
        />
        <PropertyDetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TenantUniversalHeader
          showPreferencesButton={true}
          preferencesCount={preferencesFilledCount}
        />
        <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-red-800 mb-4">
              Failed to Load Property
            </h3>
            <p className="text-red-600 mb-8">{error}</p>
            <button
              onClick={() => router.push("/app/units", { scroll: true })}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Back to Properties
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // "Not found" состояние показываем только когда:
  // - нет локального property
  // - нет данных из RTK Query
  // - запрос не в процессе (isLoading/isFetching)
  // иначе возможен мерцание (например, при возврате из кэша).
  if (!property && !propertyData && !isLoading && !isFetching) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TenantUniversalHeader
          showPreferencesButton={true}
          preferencesCount={preferencesFilledCount}
        />
        <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-yellow-800 mb-4">
              Property Not Found
            </h3>
            <p className="text-yellow-600 mb-8">
              The requested property could not be found.
            </p>
            <button
              onClick={() => router.push("/app/units", { scroll: true })}
              className="bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
            >
              Back to Properties
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const publishDate = new Date(property?.created_at || Date.now());

  const buildingTypeLabel = (() => {
    const raw = property.building_type
      ? String(property.building_type).toLowerCase()
      : "";
    const key = raw ? getBuildingTypeTranslationKey(raw) : undefined;
    if (key) return t(key);
    if (raw)
      return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return t(wizardKeys.step3.propertyTypeOptions[0]);
  })();

  const propertyTypeLabel = (() => {
    const raw = property.property_type
      ? String(property.property_type).toLowerCase()
      : "";
    const key = raw ? getPropertyTypeTranslationKey(raw) : undefined;
    if (key) return t(key);
    if (raw)
      return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return t(wizardKeys.step3.propertyTypeOptions[0]);
  })();

  const furnishingLabel = (() => {
    const raw = property.furnishing
      ? String(property.furnishing).toLowerCase()
      : "";
    const key = raw ? getFurnishingTranslationKey(raw) : undefined;
    if (key) return t(key);
    return t(wizardKeys.step3.furnishingCount[1]);
  })();

  const bedroomsLabel = (() => {
    const n = property.bedrooms;
    if (n == null || n === 0) return "N/A";
    if (n >= 5) return t(wizardKeys.step3.roomsCount[4]);
    return t(wizardKeys.step3.roomsCount[n - 1]);
  })();

  const bathroomsLabel = (() => {
    const n = property.bathrooms;
    if (n == null || n === 0) return "N/A";
    if (n >= 4) return t(wizardKeys.step3.bathroomsCount[3]);
    return t(wizardKeys.step3.bathroomsCount[n - 1]);
  })();

  const sizeLabel =
    property.square_meters != null
      ? `${Math.round(property.square_meters * 10.764)} ${t(listingPropertyKeys.card.sqFt)}`
      : "N/A";

  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: "auto" }}>
      <TenantUniversalHeader
        showPreferencesButton={true}
        preferencesCount={preferencesFilledCount}
      />

      {/* Header with title and actions */}
      <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 pt-24 sm:pt-28 lg:pt-32">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                {property.title || "Property Title"}
              </h1>
              <button
                className="flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white text-gray-600 transition-colors cursor-pointer rounded-lg"
                aria-label="Share property"
              >
                <Share className="w-5 h-5" />
              </button>
              <button
                onClick={handleShortlistToggle}
                disabled={shortlistLoading}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all cursor-pointer ${
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
                {t(listingPropertyKeys.details.listedOn)}{" "}
                {publishDate.toLocaleDateString("en-GB")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content: gallery + sticky price card */}
      <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left: Gallery with preview carousel */}
          <div className="lg:col-span-2 relative">
            {allImages.length > 0 ? (
              <>
                {/* Main image */}
                <div className="relative rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden mb-1 sm:mb-1.5 lg:mb-1">
                  <ImageGallery
                    media={combinedMedia}
                    images={combinedLegacyImages}
                    alt={property.title || "Property"}
                  />

                  {/* Match indicator - reuse same breakdown tooltip as cards */}
                  {isAuthenticated &&
                    user &&
                    (user.role === "tenant" || user.role === "admin") &&
                    !matchLoading &&
                    matchScore !== null && (
                      <MatchBadgeTooltip
                        matchScore={matchScore}
                        matchCategories={matchCategories}
                      />
                    )}
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-6">
                {t(listingPropertyKeys.details.sectionTitle)}
              </h2>
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl py-3 px-3 sm:py-4 sm:px-4">
                <div className="grid grid-cols-2 sm:grid-cols-[repeat(3,minmax(5.5rem,1fr))] lg:grid-cols-[repeat(6,minmax(5.5rem,1fr))] gap-x-3 gap-y-4 sm:gap-6">
                  <div className="flex flex-col items-center justify-center min-w-[5rem] sm:min-w-0 py-1">
                    <p className="text-xs sm:text-sm text-gray-500 sm:whitespace-nowrap">
                      {t(wizardKeys.step4.des.text1)}
                    </p>
                    <p className="text-black rounded-lg text-sm sm:text-base text-center break-words">
                      {buildingTypeLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 pl-0 sm:pl-6 min-w-[5rem] sm:min-w-0">
                    <div className="hidden sm:block h-8 w-px bg-gray-200 flex-shrink-0" />
                    <div className="flex flex-col items-center justify-center min-w-0 py-1 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 sm:whitespace-nowrap">
                        {t(wizardKeys.step3.des.text1)}
                      </p>
                      <p className="text-black rounded-lg text-sm sm:text-base text-center break-words">
                        {propertyTypeLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 pl-0 sm:pl-6 min-w-[5rem] sm:min-w-0">
                    <div className="hidden sm:block h-8 w-px bg-gray-200 flex-shrink-0" />
                    <div className="flex flex-col items-center justify-center min-w-0 py-1 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 sm:whitespace-nowrap">
                        {t(wizardKeys.step3.des.text4)}
                      </p>
                      <p className="text-black rounded-lg text-sm sm:text-base text-center break-words">
                        {furnishingLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 pl-0 sm:pl-6 min-w-[5rem] sm:min-w-0">
                    <div className="hidden sm:block h-8 w-px bg-gray-200 flex-shrink-0" />
                    <div className="flex flex-col items-center justify-center min-w-0 py-1 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 sm:whitespace-nowrap">
                        {t(wizardKeys.step3.des.text2)}
                      </p>
                      <p className="text-black rounded-lg text-sm sm:text-base text-center break-words">
                        {bedroomsLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 pl-0 sm:pl-6 min-w-[5rem] sm:min-w-0">
                    <div className="hidden sm:block h-8 w-px bg-gray-200 flex-shrink-0" />
                    <div className="flex flex-col items-center justify-center min-w-0 py-1 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 sm:whitespace-nowrap">
                        {t(wizardKeys.step3.des.text3)}
                      </p>
                      <p className="text-black rounded-lg text-sm sm:text-base text-center break-words">
                        {bathroomsLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 pl-0 sm:pl-6 min-w-[5rem] sm:min-w-0">
                    <div className="hidden sm:block h-8 w-px bg-gray-200 flex-shrink-0" />
                    <div className="flex flex-col items-center justify-center min-w-0 py-1 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 sm:whitespace-nowrap">
                        {t(wizardKeys.step3.des.text6)}
                      </p>
                      <p className="text-black rounded-lg text-sm sm:text-base text-center break-words">
                        {sizeLabel}
                      </p>
                    </div>
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
                <div className="flex items-start gap-3 mb-6 p-4">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    <div className="text-center leading-tight px-1">
                      <div>BUILDING</div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-start flex-1">
                    <div className="text-gray-600 text-sm mb-1">
                      {t(listingPropertyKeys.building.label)}
                    </div>
                    <button
                      className="font-semibold text-2xl text-black mb-1 cursor-pointer hover:underline transition-colors text-left"
                      onClick={() =>
                        router.push(`/app/buildings/${property.building?.id}`, {
                          scroll: true,
                        })
                      }
                    >
                      {property.building?.name}
                    </button>
                    <button
                      className="text-black text-sm underline text-left cursor-pointer font-medium hover:text-slate-700 transition-colors"
                      onClick={() =>
                        router.push(`/app/buildings/${property.building?.id}`, {
                          scroll: true,
                        })
                      }
                    >
                      {t(listingPropertyKeys.building.seeMore)}
                    </button>
                  </div>
                </div>
              )}

              {/* Availability */}
              <div className="mb-4 flex items-baseline font-semibold">
                <p className="text-base text-black mb-1 px-4">
                  {t(listingPropertyKeys.availability.availableFrom)}
                </p>
                <p className="text-base text-black">
                  {property.available_from
                    ? new Date(property.available_from).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )
                    : "Not specified"}
                </p>
              </div>

              {/* Price and booking */}
              <div className="bg-white px-4">
                <div className="mb-3 flex items-center">
                  <div className="text-3xl sm:text-4xl font-bold text-black mb-1">
                    £{Number(property.price || 0).toLocaleString()}
                  </div>
                  <div className="text-base text-gray-600 ml-5">
                    {t(propertyDetailsKeys.pcm)}
                  </div>
                </div>

                <Button
                  className="w-full bg-black hover:bg-black/85 cursor-pointer text-white py-3 sm:py-4 rounded-full text-sm sm:text-base font-semibold mb-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  onClick={handleBookApartment}
                  disabled={bookingLoading || hasBookingRequest}
                >
                  {hasBookingRequest
                    ? t(listingPropertyKeys.pricing.bookRequested)
                    : bookingLoading
                      ? "Sending..."
                      : t(propertyDetailsKeys.btn.book)}
                </Button>
                {bookingInlineError && (
                  <p className="text-sm text-red-600 text-center mb-3">
                    {bookingInlineError}
                  </p>
                )}
                {/* 
                <p className="text-xs text-gray-500 text-center mb-6">
                  You won&apos;t be charged yet, only after reservation and
                  approve your form
                </p> */}

                {/* Payment breakdown */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-semibold text-black mb-4 text-sm sm:text-base">
                    {t(listingPropertyKeys.payments.breakdownTitle)}
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
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="font-semibold text-black">Total</span>
                      <span className="font-bold text-black text-base">
                        £{(Number(property.price || 0) * 2).toLocaleString()}
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
      <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <div className="w-full lg:w-2/3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            {t(listingPropertyKeys.description.sectionTitle)}
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
                      showTruncation && !showFullDescription
                        ? "line-clamp-3"
                        : ""
                    } overflow-hidden`}
                  >
                    {description}
                  </div>
                  {showTruncation && (
                    <button
                      onClick={() =>
                        setShowFullDescription(!showFullDescription)
                      }
                      className="text-black underline text-sm hover:text-black/85 font-medium mt-2"
                    >
                      {showFullDescription ? "Show less" : "More information"}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* What this place offers */}
      <div className="max-w-[88rem] mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <div className="w-full lg:w-2/3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            {t(listingPropertyKeys.keyFeatures.sectionTitle)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-1">
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
                  <div
                    key={i}
                    className="flex items-center gap-2 sm:gap-3 py-2"
                  >
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
                  className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 cursor-pointer rounded-3xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
                >
                  {showAllOffers
                    ? `Show less`
                    : `${t(propertyDetailsKeys.showMoreBtn)} (${allAmenitiesList.length})`}
                </button>
              )
            );
          })()}
        </div>
      </div>

      {/* Accommodation Terms */}

      {/* See more apartments from this building */}
      {property.building && (
        <BuildingPropertiesSection
          buildingId={property.building.id}
          buildingName={property.building.name}
          currentPropertyId={property.id}
          operatorId={property.operator?.id}
          operatorName={property.operator?.full_name}
        />
      )}

      {/* Other options from your preferences */}
      <PreferencePropertiesSection
        currentPropertyId={property.id}
        currentOperatorId={property.operator?.id}
      />

      {isBookingModalOpen && (
        <div
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 px-4 py-4 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-label={t(listingPropertyKeys.viewingRequest.title)}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsBookingModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-xl max-h-[92vh] rounded-4xl bg-[#F9FAFC] shadow-2xl overflow-hidden mx-auto my-auto">
            <div className="relative px-8 pt-8 pb-12 flex flex-col max-h-[92vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute right-4 top-4 h-9 w-9 rounded-full bg-black/5 hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center text-black"
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>

              <div className="flex items-center mb-4">
                <img src="/black-logo.svg" alt="TADA Logo" className="h-7" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-black mb-1">
                {t(listingPropertyKeys.viewingRequest.title)}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t(listingPropertyKeys.viewingRequest.contactMethod)}
              </p>

              <div className="space-y-4 flex-1">
                <div>
                  <InputField
                    label="Name"
                    type="text"
                    value={bookingName}
                    onChange={(e) => {
                      setBookingName(e.target.value);
                      if (bookingNameError) setBookingNameError(undefined);
                    }}
                    disabled={bookingLoading}
                    error={bookingNameError}
                    className={[
                      "!bg-white sm:!bg-white",
                      bookingNameError
                        ? "ring-2 ring-red-400 focus:ring-red-500"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <div className="mt-1 px-6">
                    {bookingNameError ? (
                      <p className="text-sm text-red-600">{bookingNameError}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-2">
                  <PhoneMaskInput
                    className="w-full min-h-[72px]"
                    countryCode={bookingPhoneCountryCode}
                    onCountryChange={(code) => {
                      setBookingPhoneCountryCode(code);
                      const country =
                        getCountryByCode(code) || getDefaultCountry();
                      const fullPhone = bookingPhoneNumberOnly
                        ? `${country.dialCode} ${bookingPhoneNumberOnly}`.trim()
                        : "";
                      setBookingPhone(fullPhone);
                      if (bookingPhoneError) setBookingPhoneError(undefined);
                    }}
                    value={bookingPhoneNumberOnly}
                    onChange={(value) => {
                      const next = value ?? "";
                      setBookingPhoneNumberOnly(next);
                      const country =
                        getCountryByCode(bookingPhoneCountryCode) ||
                        getDefaultCountry();
                      const fullPhone = next
                        ? `${country.dialCode} ${next}`.trim()
                        : "";
                      setBookingPhone(fullPhone);
                      if (bookingPhoneError) setBookingPhoneError(undefined);
                    }}
                    label={t(wizardKeys.profile.phone)}
                    // Use floating label instead of native placeholder to avoid overlap.
                    placeholder=""
                    disabled={bookingLoading}
                    inputMaskProps={{
                      className: [
                        "w-full",
                        "rounded-r-4xl",
                        "bg-white",
                        "text-gray-900 text-base",
                        "placeholder-gray-500",
                        "focus:outline-none focus:ring-0",
                        "outline-none",
                        "pt-10 pb-5 h-[72px]",
                        bookingPhoneError
                          ? "ring-2 ring-red-400 focus:ring-red-500"
                          : "",
                      ].join(" "),
                    }}
                  />
                  <div className="mt-1 px-6">
                    {bookingPhoneError ? (
                      <p className="text-sm text-red-600">
                        {bookingPhoneError}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <InputField
                    label={t(generalKeys.modalForm.emailLabel)}
                    type="email"
                    value={bookingEmail}
                    onChange={(e) => {
                      setBookingEmail(e.target.value);
                      if (bookingEmailError) setBookingEmailError(undefined);
                    }}
                    disabled={bookingLoading}
                    error={bookingEmailError}
                    className={[
                      "!bg-white sm:!bg-white",
                      bookingEmailError
                        ? "ring-2 ring-red-400 focus:ring-red-500"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <div className=" mt-1 px-6">
                    {bookingEmailError ? (
                      <p className="text-sm text-red-600">
                        {bookingEmailError}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <DateInput
                    label={t(listingPropertyKeys.viewingRequest.date.from)}
                    name="booking_move_in_date"
                    value={bookingMoveInDate}
                    onChange={(date) => {
                      setBookingMoveInDate(date || null);
                      if (bookingMoveOutDate && date) {
                        const out = new Date(bookingMoveOutDate);
                        const inn = new Date(date);
                        if (
                          !isNaN(out.getTime()) &&
                          !isNaN(inn.getTime()) &&
                          out < inn
                        ) {
                          setBookingMoveOutDate(null);
                        }
                      }
                    }}
                    minDate={new Date().toISOString().split("T")[0]}
                    placeholder={t(wizardKeys.profile.birth.text)}
                    disabled={bookingLoading}
                    className="[&_input]:!bg-white"
                  />
                  <DateInput
                    label={t(listingPropertyKeys.viewingRequest.date.to)}
                    name="booking_move_out_date"
                    value={bookingMoveOutDate}
                    onChange={(date) => {
                      setBookingMoveOutDate(date || null);
                    }}
                    minDate={
                      bookingMoveInDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    placeholder={t(wizardKeys.profile.birth.text)}
                    disabled={bookingLoading}
                    className="[&_input]:!bg-white"
                  />
                </div>

                <div className="bg-white rounded-3xl px-6 py-4">
                  <div className="relative">
                    <label
                      htmlFor="booking-description"
                      className="absolute left-0 top-0 pointer-events-none text-xs text-gray-500"
                    >
                      Description
                    </label>
                    <textarea
                      id="booking-description"
                      value={bookingDescription}
                      onChange={(e) => setBookingDescription(e.target.value)}
                      disabled={bookingLoading}
                      rows={4}
                      className="w-full pt-5 pb-4 rounded-4xl focus:outline-none transition-all duration-200 text-gray-900 bg-gray-50 sm:bg-white resize-none border-0 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {bookingSubmitError && (
                <p className="text-sm text-red-600 mt-3 text-center">
                  {bookingSubmitError}
                </p>
              )}

              <div className="mt-auto">
                <Button
                  type="button"
                  className="relative bottom-[-20] w-full bg-black hover:bg-black/85 cursor-pointer text-white py-3 sm:py-4 rounded-full text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  onClick={handleSendBookingRequest}
                  disabled={isBookingSubmitDisabled}
                >
                  {bookingLoading
                    ? "Sending..."
                    : t(listingPropertyKeys.viewingRequest.submit)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
