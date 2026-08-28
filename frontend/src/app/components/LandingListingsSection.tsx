"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGetLandingListingsQuery } from "@/store/api/properties.api";
import PropertyCard from "@/entities/property/ui/PropertyCard";
import PropertyCardSkeleton from "@/entities/property/ui/PropertyCardSkeleton";
import {
  useTranslation,
  translateWithFallback,
} from "../hooks/useTranslation";
import { operatorKeys } from "../lib/translationsKeys/operatorTranslationKeys";
import { tenantKeys } from "../lib/translationsKeys/tenantTranslationKeys";

/** Matches the backend's LANDING_LISTINGS_LIMIT; only used to size the skeleton. */
const LANDING_LISTINGS_LIMIT = 6;

const TITLE_FALLBACK = "What places we have";
const SUBTITLE_FALLBACK =
  "No more endless scrolling. No more missed opportunities. With TA-DA, renting finally works in your favour";
const SEE_ALL_FALLBACK = "See all";

interface LandingListingsSectionProps {
  landingType?: "operators" | "tenants";
}

/**
 * The properties an admin has flagged for the landings, shown to whoever walks
 * in — signed out included. Clicking a card opens `/app/properties/[id]`,
 * which is public, so the visitor gets the detail page without a sign-in wall.
 *
 * Deliberately stripped down compared with the in-app property grids: no
 * shortlist heart and no match badge, because neither means anything to a
 * visitor who has no account and no preferences yet.
 */
const LandingListingsSection: React.FC<LandingListingsSectionProps> = ({
  landingType = "operators",
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const keys = landingType === "tenants" ? tenantKeys : operatorKeys;

  const { data: properties, isLoading } = useGetLandingListingsQuery();

  const title = translateWithFallback(t, keys.listings.title, TITLE_FALLBACK);
  const subtitle = translateWithFallback(
    t,
    keys.listings.subtitle,
    SUBTITLE_FALLBACK,
  );
  const seeAll = translateWithFallback(
    t,
    keys.listings.seeAll,
    SEE_ALL_FALLBACK,
  );

  const header = (
    <div className="text-center mb-8 md:mb-12">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900">
        {title}
      </h2>
      <p className="text-gray-600 text-lg mt-4 max-w-2xl mx-auto">{subtitle}</p>
    </div>
  );

  if (isLoading) {
    return (
      <section className="lg:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
        {header}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: LANDING_LISTINGS_LIMIT }).map((_, index) => (
            <PropertyCardSkeleton key={`landing-skeleton-${index}`} />
          ))}
        </div>
      </section>
    );
  }

  // Nothing flagged — the section does not exist rather than showing an empty
  // shell on the marketing page.
  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <section
      id="landing-listings"
      data-testid="landing-listings"
      className="lg:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20"
    >
      {header}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.slice(0, LANDING_LISTINGS_LIMIT).map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            variant="enhanced"
            onClick={() => router.push(`/app/properties/${property.id}`)}
            // No heart, no match badge. The badge hides itself when no
            // matchScore is passed, and this section never fetches matches;
            // `isAuthenticated={false}` pins the card's own default so a
            // logged-in admin sees the same stripped card as a visitor.
            showShortlist={false}
            showShortlistForAllRoles={false}
            isAuthenticated={false}
          />
        ))}
      </div>

      <div className="flex justify-center mt-10 md:mt-12">
        <button
          type="button"
          // Same sign-in entry point as the landing's "Get started" CTAs
          // (Header, tenant hero, tenant cards) — the full catalogue is behind
          // auth, so "See all" sends the visitor to sign in, not to /app/units.
          onClick={() => router.push("/app/auth")}
          className="bg-black cursor-pointer text-white px-10 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors"
        >
          {seeAll}
        </button>
      </div>
    </section>
  );
};

export default LandingListingsSection;
