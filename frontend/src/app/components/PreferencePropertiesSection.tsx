"use client";

import React, { useState, useEffect } from "react";
import { propertiesAPI } from "../lib/api";
import { Property } from "../types";

interface PreferencePropertiesSectionProps {
  currentPropertyId: string;
  currentOperatorId?: string;
}

const PreferencePropertiesSection: React.FC<
  PreferencePropertiesSectionProps
> = ({ currentPropertyId, currentOperatorId }) => {
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
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-6 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-200 rounded-2xl h-64"></div>
            <div className="bg-gray-200 rounded-2xl h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="max-w-[92%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-black">
          Other options from your preferences
        </h2>
        <button
          className="text-black text-sm underline hover:text-gray-600 font-medium"
          onClick={() => (window.location.href = "/app/units")}
        >
          See more
        </button>
      </div>

      {/* Properties grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {properties.map((property, index) => {
          const primaryImage =
            property.media?.[0]?.url ||
            property.media?.[0]?.url ||
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop";

          return (
            <div
              key={property.id}
              className="bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
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
                <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-sm font-medium">
                  {index === 0 ? "88%" : "82%"} Match
                </div>
                <button className="absolute top-3 right-3 w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-colors">
                  <svg
                    className="w-5 h-5 text-gray-600"
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
              <div className="p-4">
                <h3 className="font-semibold text-black mb-1">
                  {property.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{property.address}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    {property.bedrooms} Bed{property.bedrooms !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                      />
                    </svg>
                    {property.bathrooms} Bath
                    {property.bathrooms !== 1 ? "s" : ""}
                  </span>
                  <span>497 sq ft</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <span>{property.is_btr ? "Built to rent" : "Private"}</span>
                  <span>•</span>
                  <span className="capitalize">{property.property_type}</span>
                  <span>•</span>
                  <span className="capitalize">
                    {property.furnishing?.replace("-", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-black">
                      {formatPrice(property.price)}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">/ month</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Today {index === 0 ? "16:30" : "17:00"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreferencePropertiesSection;
