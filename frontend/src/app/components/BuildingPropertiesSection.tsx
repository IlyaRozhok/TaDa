"use client";

import React, { useState, useEffect } from "react";
import { propertiesAPI } from "../lib/api";
import { Property } from "../types";

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

        setProperties(buildingProperties.slice(0, 2)); // Show only first 2
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
      <section className="max-w-[92%] mx-auto px-1 sm:px-1.5 lg:px-2 py-1.5 sm:py-2">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-64 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-1.5"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg h-80"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[92%] mx-auto px-1 sm:px-1.5 lg:px-2 py-1.5 sm:py-2">
      <div className="mb-1.5">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">
          More apartments from {buildingName}
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Discover other available properties in this building
        </p>
      </div>

      {/* Building properties grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {properties.map((property, index) => {
          const primaryImage =
            property.media?.[0]?.url ||
            property.images?.[0] ||
            property.photos?.[0] ||
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop";

          return (
            <div
              key={property.id}
              className="bg-white rounded-lg sm:rounded-xl border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() =>
                (window.location.href = `/app/properties/${property.id}`)
              }
            >
              <div className="relative">
                <img
                  src={primaryImage}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop";
                  }}
                />
                <div className="absolute top-0.75 left-0.75 bg-black bg-opacity-70 text-white px-0.5 py-0.25 rounded-lg text-xs font-medium">
                  {index === 0 ? "90%" : "85%"} Match
                </div>
                <button className="absolute top-0.75 right-0.75 w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-colors">
                  <svg
                    className="w-4 h-4 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-1">
                <div className="flex items-start justify-between mb-0.5">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {property.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {property.apartment_number && `Apt ${property.apartment_number}, `}
                      {buildingName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                    <span>{property.bedrooms || 0} bed</span>
                    <span>•</span>
                    <span>{property.bathrooms || 0} bath</span>
                    {property.square_meters && (
                      <>
                        <span>•</span>
                        <span>{property.square_meters} sq ft</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-baseline gap-0.25">
                    <span className="text-base sm:text-lg font-bold text-gray-900">
                      £{property.price?.toLocaleString() || "N/A"}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600">/ month</span>
                  </div>
                  <div className="flex items-center gap-0.25">
                    <span className="text-xs text-gray-500">
                      {property.building_type?.replace("_", " ") || "Apartment"}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500 capitalize">
                      {property.furnishing || "Furnished"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View all button */}
      {properties.length >= 2 && (
        <div className="mt-1.5 text-center">
          <button
            onClick={() => (window.location.href = `/app/buildings/${buildingId}`)}
            className="btn-base btn-outline btn-md"
          >
            View all properties in {buildingName}
          </button>
        </div>
      )}
    </section>
  );
};

export default BuildingPropertiesSection;

