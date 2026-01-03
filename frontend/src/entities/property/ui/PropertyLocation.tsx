"use client";

import React from "react";
import { Property } from "@/app/types";

interface PropertyLocationProps {
  property: Property;
}

export default function PropertyLocation({ property }: PropertyLocationProps) {
  if (!property.address) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Location
      </h2>
      <p className="text-gray-600">{property.address}</p>
    </section>
  );
}
