"use client";

import React, { useState } from "react";
import { Property } from "../types";
import { Check, X } from "lucide-react";

interface MatchReason {
  criterion: string;
  matches: boolean;
  details: string;
}

interface MatchTooltipProps {
  property: Property;
  matchScore: number;
  userPreferences?: any; // TODO: Type this properly based on preferences structure
  children: React.ReactNode;
}

export default function MatchTooltip({
  property,
  matchScore,
  userPreferences,
  children,
}: MatchTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Calculate match reasons based on property and user preferences
  const getMatchReasons = (): MatchReason[] => {
    const reasons: MatchReason[] = [];

    // Price matching
    if (userPreferences?.min_price && userPreferences?.max_price) {
      const propertyPrice =
        typeof property.price === "string"
          ? parseFloat(property.price)
          : property.price;
      const isWithinBudget =
        propertyPrice >= userPreferences.min_price &&
        propertyPrice <= userPreferences.max_price;
      reasons.push({
        criterion: "Price",
        matches: isWithinBudget,
        details: `Price ${propertyPrice.toFixed(0)} within budget ${
          userPreferences.min_price
        }-${userPreferences.max_price}`,
      });
    }

    // Bedroom requirement
    if (userPreferences?.min_bedrooms) {
      const meetsBedroomReq = property.bedrooms >= userPreferences.min_bedrooms;
      reasons.push({
        criterion: "Bedrooms",
        matches: meetsBedroomReq,
        details: `${property.bedrooms} bedrooms meets requirements (${userPreferences.min_bedrooms}+needed)`,
      });
    }

    // Property type matching
    if (
      userPreferences?.property_type &&
      userPreferences.property_type.length > 0
    ) {
      const matchesType = userPreferences.property_type.includes(
        property.property_type
      );
      reasons.push({
        criterion: "Property Type",
        matches: matchesType,
        details: `${property.property_type} ${
          matchesType ? "matches" : "doesn't match"
        } preferences`,
      });
    }

    // Location matching (if available)
    if (userPreferences?.primary_postcode && property.address) {
      // Simple postcode matching - in real app you'd use proper location data
      const matchesLocation = property.address.includes(
        userPreferences.primary_postcode.split(" ")[0]
      );
      reasons.push({
        criterion: "Location",
        matches: matchesLocation,
        details: `Located in ${property.address}`,
      });
    }

    // Lifestyle features matching
    if (userPreferences?.lifestyle_features && property.lifestyle_features) {
      const matchingFeatures = property.lifestyle_features.filter((feature) =>
        userPreferences.lifestyle_features.includes(feature)
      );
      const hasMatchingFeatures = matchingFeatures.length > 0;
      reasons.push({
        criterion: "Lifestyle Features",
        matches: hasMatchingFeatures,
        details: hasMatchingFeatures
          ? `Includes ${matchingFeatures.join(", ")}`
          : "No matching lifestyle features",
      });
    }

    return reasons;
  };

  const matchReasons = getMatchReasons();

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-pointer"
      >
        {children}
      </div>

      {isVisible && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 w-64"
          style={{ pointerEvents: "none" }}
        >
          <div className="bg-gray-800 text-white rounded-lg p-3 shadow-xl">
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-3 h-3 bg-gray-800 rotate-45"></div>
            </div>

            <h3 className="text-base font-semibold text-white mb-2">
              Why this matches?
            </h3>

            <div className="space-y-2">
              {matchReasons.map((reason, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {reason.matches ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-xs leading-relaxed">
                      {reason.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {matchReasons.length === 0 && (
              <p className="text-gray-300 text-sm">
                No specific matching criteria available
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
