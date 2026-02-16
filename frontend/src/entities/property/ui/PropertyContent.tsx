import React from "react";
import { MapPin } from "lucide-react";
import { Property } from "@/app/types";

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

  const formatArea = (sqm: number) => {
    const sqft = Math.round(sqm * 10.764);
    return `${sqft} sq ft`;
  };

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
    attributeParts.push(
      property.property_type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    );
  }
  if (property.furnishing) {
    attributeParts.push(
      property.furnishing.replace(/\b\w/g, (c) => c.toUpperCase()),
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
            {property.bedrooms} Bed{property.bedrooms !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center">
          <img src="/baths.svg" alt="" className={iconClass} />
          <span>
            {property.bathrooms} Bath{property.bathrooms !== 1 ? "s" : ""}
          </span>
        </div>
        {areaSqm != null && (
          <div className="flex items-center">
            <img src="/sqmeters.svg" alt="" className={iconClass} />
            <span>{formatArea(areaSqm)}</span>
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
          <span className="text-sm font-normal text-gray-500">/ month</span>
        </span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-500">{availabilityText}</span>
      </div>
    </div>
  );
};
