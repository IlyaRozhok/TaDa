import React from "react";
import { Property } from "../types";
import { MapPin, Bed, Bath, Calendar } from "lucide-react";

interface PropertyContentProps {
  property: Property;
  shortlistSuccess?: string | null;
  shortlistError?: string | null;
}

export const PropertyContent: React.FC<PropertyContentProps> = ({
  property,
  shortlistSuccess,
  shortlistError,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-5">
      {/* Title and Price */}
      <div className="mb-3">
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
      <div className="flex items-center text-slate-600 mb-3">
        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
        <span className="text-sm line-clamp-1">{property.address}</span>
      </div>

      {/* Property Details */}
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <div className="flex items-center">
          <Bed className="w-4 h-4 mr-1" />
          <span>
            {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center">
          <Bath className="w-4 h-4 mr-1" />
          <span>
            {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          <span>
            {property.available_from
              ? formatDate(property.available_from)
              : "Available now"}
          </span>
        </div>
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

      {/* Furnishing */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-slate-600 capitalize">
          {property.furnishing}
        </span>

        {/* Operator Info */}
        {property.operator && (
          <span className="text-xs text-slate-500">
            By {property.operator.full_name || property.operator.email}
          </span>
        )}
      </div>

      {/* Status Messages */}
      {(shortlistSuccess || shortlistError) && (
        <div
          className={`mt-3 p-2 rounded-md text-sm ${
            shortlistSuccess
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {shortlistSuccess || shortlistError}
        </div>
      )}
    </div>
  );
};
