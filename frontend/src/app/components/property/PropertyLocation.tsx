"use client";

import React from "react";
import PropertyMapGoogle from "../PropertyMapGoogle";
import { Property } from "../../types";

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
        Appart location
      </h2>
      <p className="text-gray-600 mb-4">{property.address}</p>
      <div className="rounded-2xl overflow-hidden border">
        <PropertyMapGoogle
          address={property.address}
          title={property.title}
          height="460px"
          className="w-full"
        />
      </div>
    </section>
  );
}
