"use client";

import React from "react";
import { Property } from "../../types";

interface PropertyAmenitiesProps {
  property: Property;
}

export default function PropertyAmenities({
  property,
}: PropertyAmenitiesProps) {
  if (
    !property.lifestyle_features ||
    property.lifestyle_features.length === 0
  ) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        What this place offers
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {property.lifestyle_features
          .slice(0, 12)
          .map((feat: any, i: number) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <span className="w-5 h-5 rounded-sm border border-gray-300 inline-block"></span>
              <span className="text-gray-800">{feat}</span>
            </div>
          ))}
      </div>
      {property.lifestyle_features.length > 12 && (
        <button className="mt-4 px-4 py-2 rounded-full border text-gray-700 hover:bg-gray-50">
          See all offers ({property.lifestyle_features.length})
        </button>
      )}
    </section>
  );
}
