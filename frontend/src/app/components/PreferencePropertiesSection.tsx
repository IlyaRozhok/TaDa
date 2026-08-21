"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGetPublicPropertiesAllQuery } from "@/store/api/properties.api";
import PropertyCard from "@/entities/property/ui/PropertyCard";
import PropertyCardSkeleton from "@/entities/property/ui/PropertyCardSkeleton";
import { usePropertyMatches } from "../hooks/usePropertyMatches";
import { useTranslation } from "../hooks/useTranslation";
import { listingPropertyKeys } from "../lib/translationsKeys/listingPropertyTranslationKeys";

interface PreferencePropertiesSectionProps {
  currentPropertyId: string;
  currentOperatorId?: string;
}

const PreferencePropertiesSection: React.FC<
  PreferencePropertiesSectionProps
> = ({ currentPropertyId, currentOperatorId }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: propertiesPage, isLoading: loading } =
    useGetPublicPropertiesAllQuery();

  // Filter out the current property and same-operator listings, then shuffle
  // and take 3. The memo is per component instance, so every mount reshuffles
  // even when the list comes from the cache — same behaviour the refetching
  // effect had.
  const properties = useMemo(() => {
    const otherProperties = (propertiesPage?.data ?? []).filter((prop) => {
      const isDifferentProperty = prop.id !== currentPropertyId;
      const isDifferentOperator =
        !currentOperatorId || prop.operator?.id !== currentOperatorId;
      return isDifferentProperty && isDifferentOperator;
    });
    const shuffled = [...otherProperties].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [propertiesPage, currentPropertyId, currentOperatorId]);

  const propertyIds = useMemo(() => properties.map((p) => p.id), [properties]);
  const { matchByPropertyId } = usePropertyMatches(propertyIds);

  if (loading) {
    return (
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-6 bg-gray-200 rounded mb-6 w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="lg:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-8">
      <div className="lg:flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-black">
          {t(listingPropertyKeys.recommendations.title)}
        </h2>
        <button
          className="text-black cursor-pointer text-sm underline hover:text-gray-600 font-medium"
          onClick={() => router.push("/app/units")}
        >
          {t(listingPropertyKeys.recommendations.seeMore)}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => {
          const match = matchByPropertyId[property.id];
          return (
            <PropertyCard
            variant="enhanced"
              key={property.id}
              property={property}
              matchScore={match?.matchScore}
              matchCategories={match?.matchCategories}
              onClick={() => router.push(`/app/properties/${property.id}`)}
              showShortlist={true}
              showShortlistForAllRoles={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PreferencePropertiesSection;
