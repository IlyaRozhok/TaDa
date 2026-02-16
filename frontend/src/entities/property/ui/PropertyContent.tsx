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

  return (
    <div className="p-5">
      {/* Title and Price */}
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-slate-900 mb-1 line-clamp-1">
          {property.title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-slate-900">
            {formatPrice(property.price)}
            <span className="text-sm font-normal text-slate-500">/month</span>
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center text-slate-600 mb-2">
        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
        <span className="text-sm line-clamp-1">{property.address}</span>
      </div>

      {/* Property Details */}
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <div className="flex items-center">
          <img src="/beds.svg" alt="" className={iconClass} />
          <span>
            {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center">
          <img src="/baths.svg" alt="" className={iconClass} />
          <span>
            {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
          </span>
        </div>
        {areaSqm != null && (
          <div className="flex items-center">
            <img src="/sqmeters.svg" alt="" className={iconClass} />
            <span>{areaSqm} m²</span>
          </div>
        )}
      </div>

      {/* Features */}
      {property.lifestyle_features &&
        property.lifestyle_features.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {property.lifestyle_features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs"
              >
                {feature}
              </span>
            ))}
            {property.lifestyle_features.length > 3 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">
                +{property.lifestyle_features.length - 3} more
              </span>
            )}
          </div>
        )}

      {/* Property Type (replaces Furnished/Unfurnished) */}
      {property.property_type && (
        <div className="mt-3">
          <span className="text-sm text-slate-600 capitalize">
            {property.property_type.replace(/_/g, " ")}
          </span>
        </div>
      )}
    </div>
  );
};
