"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "@/store/slices/authSlice";
import { Property } from "./types";
import HomepagePropertyCard from "./components/HomepagePropertyCard";
import PropertyCardSkeleton from "./components/PropertyCardSkeleton";
import AuthModal from "./components/AuthModal";
import DualLandingWrapper from "./components/DualLandingWrapper";
import { Search, ChevronDown, MapPin } from "lucide-react";
import { useDebounce } from "./hooks/useDebounce";
import { useTranslation } from "./hooks/useTranslation";

type CookieConsentDecision = "accepted" | "rejected";

const COOKIE_CONSENT_STORAGE_KEY = "tada_cookie_consent_v1";
const COOKIE_CONSENT_COOKIE_KEY = "tada_cookie_consent";
const COOKIE_CONSENT_MAX_AGE_DAYS = 365;

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const encodedName = encodeURIComponent(name);
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${encodedName}=([^;]*)`),
  );

  if (!match) return null;
  try {
    return decodeURIComponent(match[1] ?? "");
  } catch {
    return match[1] ?? null;
  }
}

function writeCookieValue(name: string, value: string) {
  if (typeof document === "undefined") return;

  const maxAgeSeconds = COOKIE_CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  const isSecure = window.location.protocol === "https:";

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value,
  )}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`;
}

// Mock match data for demonstration
const generateMockMatchData = (propertyId: string) => {
  // Create a consistent hash from property ID for deterministic results
  const hash = propertyId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const matchScore = 75 + (hash % 25); // Range: 75-99%
  return {
    matchScore: Math.min(matchScore, 99),
    matchReasons: [
      "Budget matches your preferences",
      "Great location for commuting",
      "Property type fits your needs",
    ],
  };
};

export default function HomePage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();
  const { t } = useTranslation();

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [language] = useState("EN");
  const [sortBy] = useState("Best Match Score");

  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [cookieConsentChecked, setCookieConsentChecked] = useState(false);

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const persistCookieConsentDecision = useCallback(
    (decision: CookieConsentDecision) => {
      try {
        window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, decision);
      } catch {
        // localStorage может быть недоступен (например, в приватном режиме)
      }
      writeCookieValue(COOKIE_CONSENT_COOKIE_KEY, decision);

      // Хук для будущей логики загрузки cookie-зависимых скриптов
      window.dispatchEvent(
        new CustomEvent("tada:cookieConsentChanged", {
          detail: { decision },
        }),
      );
    },
    [],
  );

  // Auto-redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role || "tenant";
      router.replace(`/app/units/`);
    }
  }, [isAuthenticated, user, router]);

  // Show cookie consent popup only for undecided users on the landing.
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isAuthenticated) {
      setShowCookieConsent(false);
      setCookieConsentChecked(true);
      return;
    }

    const localValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    const cookieValue = readCookieValue(COOKIE_CONSENT_COOKIE_KEY);
    const rawDecision = localValue ?? cookieValue;
    const hasValidDecision =
      rawDecision === "accepted" || rawDecision === "rejected";

    setShowCookieConsent(!hasValidDecision);
    setCookieConsentChecked(true);
  }, [isAuthenticated]);

  // Filter properties based on search term
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const filtered = properties.filter((property) => {
      const searchLower = debouncedSearchTerm.toLowerCase();

      // Search in title
      if (property.title?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in description
      if (property.description?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in property_type
      if (property.property_type?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in address (optional)
      if (property.address?.toLowerCase().includes(searchLower)) {
        return true;
      }

      return false;
    });

    setFilteredProperties(filtered);
  }, [debouncedSearchTerm, properties]);

  const handlePropertyClick = (property: Property) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      router.push(`/app/properties/${property.id}`);
    }
  };

  const handleSignIn = () => {
    console.log("🔍 handleSignIn called, setting authModalOpen to true");
    // Reset modal state when opening
    setAuthModalOpen(true);
  };

  const handleAcceptCookieConsent = useCallback(() => {
    persistCookieConsentDecision("accepted");
    setShowCookieConsent(false);
  }, [persistCookieConsentDecision]);

  const handleRejectCookieConsent = useCallback(() => {
    // На этом шаге не делаем манипуляции скриптами, только фиксируем решение.
    persistCookieConsentDecision("rejected");
    setShowCookieConsent(false);
  }, [persistCookieConsentDecision]);

  useEffect(() => {
    if (!showCookieConsent) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleRejectCookieConsent();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCookieConsent, handleRejectCookieConsent]);

  // Show loading state while redirecting authenticated users
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Skeleton */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1 max-w-md mx-8 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex gap-4">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-[92%] mx-auto px-4 py-12">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <PropertyCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Show Dual Landing for non-authenticated users */}
      {!isAuthenticated ? (
        <DualLandingWrapper onSignIn={handleSignIn} />
      ) : (
        <>
          {/* Header for authenticated users */}
          <header className="border-b border-gray-100 sticky top-0 z-50 bg-white">
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                {/* Logo */}
                <div className="flex items-center">
                  <img
                    src="/black-logo.svg"
                    alt="TADA Logo"
                    className="h-8 sm:h-10"
                  />
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-md mx-8">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search property, location, or type of property"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {/* Search indicator - removed spinner, using debounce instead */}
                    {/* Clear search button */}
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                  {/* Language Dropdown */}
                  <div className="relative">
                    <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                      <span className="font-medium cursor-pointer">
                        {language}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sign In Button */}
                  <button
                    onClick={handleSignIn}
                    className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Listed Properties Section for authenticated users */}
          <section className="py-12">
            <div className="max-w-[92%] mx-auto px-4">
              {/* Section Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Listed property
                  </h2>
                  <p className="text-gray-600">
                    After you log in, our service gives you the best results
                    tailored to your preferences • {filteredProperties.length}{" "}
                    items
                    {searchTerm &&
                      filteredProperties.length !== properties.length && (
                        <span className="text-blue-600 font-medium">
                          {" "}
                          (filtered from {properties.length})
                        </span>
                      )}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Sort Dropdown */}
                  <div className="relative">
                    <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50">
                      <span>{sortBy}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Properties Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <PropertyCardSkeleton key={`skeleton-${index}`} />
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                  <h3 className="text-xl font-semibold text-red-800 mb-4">
                    Failed to Load Properties
                  </h3>
                  <p className="text-red-600 mb-6">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredProperties.length === 0 && searchTerm ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    No properties found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No properties match your search for "{searchTerm}". Try
                    adjusting your search terms.
                  </p>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.slice(0, 6).map((property) => {
                    const mockMatch = generateMockMatchData(property.id);
                    return (
                      <HomepagePropertyCard
                        key={property.id}
                        property={property}
                        matchScore={mockMatch.matchScore}
                        onClick={() => handlePropertyClick(property)}
                        showShortlist={isAuthenticated} // Show shortlist for authenticated users
                        isAuthenticated={isAuthenticated} // Pass authentication status
                      />
                    );
                  })}
                </div>
              )}

              {/* Show More Properties Message for Authenticated Users */}
              {!loading &&
                !error &&
                isAuthenticated &&
                filteredProperties.length > 6 && (
                  <div className="text-center mt-12">
                    <div className="bg-gray-100 rounded-lg p-6">
                      <p className="text-gray-700 mb-4">
                        Showing{" "}
                        <span className="font-bold text-blue-600">6</span> of{" "}
                        <span className="font-bold text-blue-600">
                          {filteredProperties.length}
                        </span>{" "}
                        available properties. View all properties to see
                        personalized matches based on your preferences.
                      </p>
                      <button
                        onClick={() => router.push("/app/properties")}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        View All Properties
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </section>
        </>
      )}

      {/* Cookie consent popup (landing only) */}
      {!isAuthenticated && cookieConsentChecked && showCookieConsent && (
        <div className="fixed inset-x-0 bottom-2 z-[100] flex justify-end px-4">
          <div
            role="dialog"
            aria-modal="false"
            aria-labelledby="cookie-consent-title"
            className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-200"
          >
            <div className="p-6 sm:p-7">
              <h2
                id="cookie-consent-title"
                className="text-xl font-semibold text-gray-900"
              >
                {t("cookies.title")}
              </h2>
              <p className="mt-2 text-gray-800">{t("cookies.description")}</p>

              <div className="mt-6 flex items-center gap-6 flex-wrap">
                <button
                  type="button"
                  onClick={handleAcceptCookieConsent}
                  className="bg-black cursor-pointer text-white px-10 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  {t("cookies.button.accept")}
                </button>

                <button
                  type="button"
                  onClick={handleRejectCookieConsent}
                  className="text-gray-900 cursor-pointer font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  {t("cookies.button.reject")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          console.log("🔍 onClose called, setting authModalOpen to false");
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
}
