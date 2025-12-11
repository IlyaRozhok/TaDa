"use client";

import React from "react";
import { Bed, Bath } from "lucide-react";
import { Property } from "@/app/types";

interface PropertyDetailsProps {
  property: Property;
}

export default function PropertyDetails({ property }: PropertyDetailsProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Details</h2>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">Property type</p>
          <p className="text-gray-900 font-semibold capitalize">
            {property.property_type || "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Property type</p>
          <p className="text-gray-900 font-semibold capitalize">Apartment</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Furnishing</p>
          <p className="text-gray-900 font-semibold capitalize">
            {property.furnishing || "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Bedrooms</p>
          <p className="text-gray-900 font-semibold flex items-center gap-2">
            <Bed className="w-4 h-4" /> {property.bedrooms ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Bathrooms</p>
          <p className="text-gray-900 font-semibold flex items-center gap-2">
            <Bath className="w-4 h-4" /> {property.bathrooms ?? "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
