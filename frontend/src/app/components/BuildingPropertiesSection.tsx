"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { propertiesAPI } from "../lib/api";
import { Property } from "../types";
import EnhancedPropertyCard from "./EnhancedPropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";
import { usePropertyMatches } from "../hooks/usePropertyMatches";
import { useTranslation } from "../hooks/useTranslation";
import { listingPropertyKeys } from "../lib/translationsKeys/listingPropertyTranslationKeys";

interface BuildingPropertiesSectionProps {
  buildingId: string;
  buildingName: string;
  currentPropertyId: string;
  operatorId?: string;
  operatorName?: string;
}

const BuildingPropertiesSection: React.FC<BuildingPropertiesSectionProps> = ({
  buildingId,
  buildingName,
  currentPropertyId,
  operatorId,
  operatorName,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const propertyIds = useMemo(() => properties.map((p) => p.id), [properties]);
  const { matchByPropertyId } = usePropertyMatches(propertyIds);

  useEffect(() => {
    const fetchBuildingProperties = async () => {
      try {
        const response = await propertiesAPI.getAllPublic({
          building_id: buildingId,
        });

        // Handle API response format
        let allProperties = [];
        if (response.data && response.data.data) {
          allProperties = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          allProperties = response.data;
        }

        const buildingProperties = allProperties.filter((prop: Property) => {
          return prop.id !== currentPropertyId;
        });

        setProperties(buildingProperties.slice(0, 3));
      } catch (error) {
        console.error("Error fetching building properties:", error);
      } finally {
        setLoading(false);
      }
    };

    if (buildingId) {
      fetchBuildingProperties();
    }
  }, [buildingId, currentPropertyId]);

  const getBuildingInitials = () => {
    if (!buildingName) return "";
    const words = buildingName.trim().split(/\s+/);
    const initials = words
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase() || "");
    return initials.join("");
  };

  if (loading) {
    return (
      <section className="lg:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
              <span className="text-center leading-tight">
                {getBuildingInitials()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {t(listingPropertyKeys.building.label)}
              </p>
              <button
                type="button"
                onClick={() => router.push(`/app/buildings/${buildingId}`)}
                className="text-xl font-semibold text-black text-left cursor-pointer hover:underline"
              >
                {buildingName}
              </button>
              {operatorName && (
                <p className="text-sm text-gray-500">{operatorName}</p>
              )}
            </div>
          </div>
          <button
            className="text-black text-sm underline hover:text-gray-600 font-medium"
            onClick={() =>
              operatorId
                ? router.push(`/app/operators/${operatorId}`)
                : router.push(`/app/buildings/${buildingId}`)
            }
          >
            {t(listingPropertyKeys.building.seeMoreApartments)}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <PropertyCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return null;
  }

  return (
    <section className="lg:max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 lg:w-12 lg:h-12 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
            <span className="text-center leading-tight">
              {getBuildingInitials()}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              {t(listingPropertyKeys.building.label)}
            </p>
            <button
              type="button"
              onClick={() => router.push(`/app/buildings/${buildingId}`)}
              className="text-xl font-semibold text-black text-left cursor-pointer hover:underline"
            >
              {buildingName}
            </button>
            {operatorName && (
              <p className="text-sm text-gray-500">{operatorName}</p>
            )}
          </div>
        </div>
        <button
          className="text-black cursor-pointer text-sm underline hover:text-gray-600 font-medium"
          onClick={() =>
            operatorId
              ? router.push(`/app/operators/${operatorId}`)
              : router.push(`/app/buildings/${buildingId}`)
          }
        >
          {t(listingPropertyKeys.building.seeMoreApartments)}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => {
          const match = matchByPropertyId[property.id];
          return (
            <EnhancedPropertyCard
              key={property.id}
              property={property}
              matchScore={match?.matchScore}
              matchCategories={match?.matchCategories}
              onClick={() => router.push(`/app/properties/${property.id}`)}
              showShortlist={true}
              showShortlistForAllRoles={false}
            />
          );
        })}
      </div>
    </section>
  );
};

export default BuildingPropertiesSection;
