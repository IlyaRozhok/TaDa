"use client";

import React from "react";
import { Property } from "@/app/types";
import { useTranslation } from "@/app/hooks/useTranslation";
import { listingPropertyKeys } from "@/app/lib/translationsKeys/listingPropertyTranslationKeys";
import {
  getPropertyTypeTranslationKey,
  getFurnishingTranslationKey,
} from "@/shared/constants/mappings";

const iconClass = "w-4 h-4 mr-1 flex-shrink-0";

interface PropertyContentProps {
  property: Property;
  matchScore?: number;
  matchCategories?: any[];
}

export const PropertyContent: React.FC<PropertyContentProps> = ({
  property,
  matchScore,
  matchCategories, // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  const { t } = useTranslation();
  const k = listingPropertyKeys.card;

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "£0";

    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const areaSqm =
    property.square_meters ?? property.total_area ?? property.living_area;

  const formatAreaSqm = (sqm: number) =>
    `${Math.round(sqm)} ${t(k.sqFt)}`.trim();

  const availabilityText = property.available_from
    ? (() => {
        const d = new Date(property.available_from);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) {
          return "Today";
        }
        return d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });
      })()
    : "Available now";

  const attributeParts: string[] = [];
  if (property.is_btr) attributeParts.push("Built to rent");
  if (property.property_type) {
    const raw = String(property.property_type).toLowerCase();
    const typeKey = getPropertyTypeTranslationKey(raw);
    attributeParts.push(
      typeKey ? t(typeKey) : raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    );
  }
  if (property.furnishing) {
    const raw = String(property.furnishing).toLowerCase();
    const furKey = getFurnishingTranslationKey(raw);
    attributeParts.push(
      furKey ? t(furKey) : raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    );
  }

  return (
    <div className="py-4 px-1">
      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
        {property.title}
      </h3>

      {/* Address */}
      {property.address && (
        <div className="flex items-center text-gray-500 text-sm mb-2 line-clamp-1">
          <span>{property.address}</span>
        </div>
      )}

      {/* Features: Beds, Baths, Sq ft */}
      <div className="flex items-center gap-4 text-sm text-gray-900 mb-2">
        <div className="flex items-center">
          <img src="/beds.svg" alt="" className={iconClass} />
          <span>
            {property.bedrooms} {t(k.beds)}
          </span>
        </div>
        <div className="flex items-center">
          <img src="/baths.svg" alt="" className={iconClass} />
          <span>
            {property.bathrooms} {t(k.bath)}
          </span>
        </div>
        {areaSqm != null && (
          <div className="flex items-center">
            <img src="/sqmeters.svg" alt="" className={iconClass} />
            <span>{formatAreaSqm(areaSqm)}</span>
          </div>
        )}
      </div>

      {/* Attributes: Built to rent • Type • Furnished */}
      {attributeParts.length > 0 && (
        <p className="text-sm text-gray-500 mb-2">
          {attributeParts.join(" • ")}
        </p>
      )}

      {/* Price and availability */}
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <span className="text-xl font-bold text-gray-900">
          {formatPrice(property.price)}
          <span className="text-sm font-normal text-gray-500">
            {t(k.priceMonth)}
          </span>
        </span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-500">{availabilityText}</span>
      </div>
    </div>
  );
};



