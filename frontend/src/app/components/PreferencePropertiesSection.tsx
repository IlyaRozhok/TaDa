"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { propertiesAPI } from "../lib/api";
import { Property } from "../types";
import EnhancedPropertyCard from "./EnhancedPropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";

interface PreferencePropertiesSectionProps {
  currentPropertyId: string;
  currentOperatorId?: string;
}

const PreferencePropertiesSection: React.FC<
  PreferencePropertiesSectionProps
> = ({ currentPropertyId, currentOperatorId }) => {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferenceProperties = async () => {
      try {
        const response = await propertiesAPI.getAllPublic();

        // Handle API response format
        let allProperties = [];
        if (response.data && response.data.data) {
          allProperties = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          allProperties = response.data;
        }

        // Filter out current property and properties from the same operator
        const otherProperties = allProperties.filter((prop: Property) => {
          const isDifferentProperty = prop.id !== currentPropertyId;
          const isDifferentOperator =
            !currentOperatorId || prop.operator?.id !== currentOperatorId;
          return isDifferentProperty && isDifferentOperator;
        });

        // Shuffle and take first 2
        const shuffled = otherProperties.sort(() => 0.5 - Math.random());
        setProperties(shuffled.slice(0, 2));
      } catch (error) {
        console.error("Error fetching preference properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferenceProperties();
  }, [currentPropertyId, currentOperatorId]);

  if (loading) {
    return (
      <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-6 bg-gray-200 rounded mb-6 w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-black">
          Other options from your preferences
        </h2>
        <button
          className="text-black text-sm underline hover:text-gray-600 font-medium"
          onClick={() => router.push("/app/units")}
        >
          See more
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <EnhancedPropertyCard
            key={property.id}
            property={property}
            onClick={() => router.push(`/app/properties/${property.id}`)}
            showShortlist={true}
            showShortlistForAllRoles={true}
          />
        ))}
      </div>
    </div>
  );
};

export default PreferencePropertiesSection;
