"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { propertiesAPI } from "../lib/api";
import { Property } from "../types";
import EnhancedPropertyCard from "./EnhancedPropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";

interface BuildingPropertiesSectionProps {
  buildingId: string;
  buildingName: string;
  currentPropertyId: string;
}

const BuildingPropertiesSection: React.FC<BuildingPropertiesSectionProps> = ({
  buildingId,
  buildingName,
  currentPropertyId,
}) => {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuildingProperties = async () => {
      try {
        const response = await propertiesAPI.getAllPublic({ building_id: buildingId });

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

        setProperties(buildingProperties.slice(0, 6));
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

  if (loading) {
    return (
      <section className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            More apartments from {buildingName}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Discover other available properties in this building
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
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
    <section className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          More apartments from {buildingName}
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Discover other available properties in this building
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <EnhancedPropertyCard
            key={property.id}
            property={property}
            matchScore={undefined}
            onClick={() => router.push(`/app/properties/${property.id}`)}
            showShortlist={true}
            showShortlistForAllRoles={false}
          />
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => router.push(`/app/buildings/${buildingId}`)}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
        >
          View all properties in {buildingName}
        </button>
      </div>
    </section>
  );
};

export default BuildingPropertiesSection;

