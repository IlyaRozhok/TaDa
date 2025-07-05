"use client";

import React, { useState } from "react";
import {
  Heart,
  Users,
  Briefcase,
  ShoppingCart,
  PawPrint,
  Star,
  Dumbbell,
  Wifi,
  Car,
  Coffee,
  Shield,
  TreePine,
  Utensils,
  Waves,
  Building,
  Home,
  MapPin,
  Zap,
  Package,
  Sparkles,
} from "lucide-react";

interface LifestyleFeaturesProps {
  features: string[];
  compact?: boolean;
}

// Enhanced feature mapping with better icons and colors
const FEATURE_MAPPING: Record<
  string,
  {
    category: string;
    displayName: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  }
> = {
  // Lifestyle & Wellbeing
  gym: {
    category: "Lifestyle & Wellbeing",
    displayName: "Gym",
    icon: <Dumbbell className="w-5 h-5" />,
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100",
  },
  pool: {
    category: "Lifestyle & Wellbeing",
    displayName: "Swimming Pool",
    icon: <Waves className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  spa: {
    category: "Lifestyle & Wellbeing",
    displayName: "Spa & Wellness",
    icon: <Heart className="w-5 h-5" />,
    color: "text-pink-600",
    bgColor: "bg-pink-50 hover:bg-pink-100",
  },
  yoga_studio: {
    category: "Lifestyle & Wellbeing",
    displayName: "Yoga Studio",
    icon: <Heart className="w-5 h-5" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
  },
  fitness_center: {
    category: "Lifestyle & Wellbeing",
    displayName: "Fitness Center",
    icon: <Dumbbell className="w-5 h-5" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
  },

  // Social / Community Spaces
  rooftop_terrace: {
    category: "Social / Community Spaces",
    displayName: "Rooftop Terrace",
    icon: <Building className="w-5 h-5" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
  },
  community_lounge: {
    category: "Social / Community Spaces",
    displayName: "Community Lounge",
    icon: <Users className="w-5 h-5" />,
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
  },
  co_working_space: {
    category: "Social / Community Spaces",
    displayName: "Co-working Space",
    icon: <Briefcase className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  cinema_room: {
    category: "Social / Community Spaces",
    displayName: "Cinema Room",
    icon: <Users className="w-5 h-5" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
  },
  games_room: {
    category: "Social / Community Spaces",
    displayName: "Games Room",
    icon: <Users className="w-5 h-5" />,
    color: "text-teal-600",
    bgColor: "bg-teal-50 hover:bg-teal-100",
  },

  // Work & Study
  high_speed_internet: {
    category: "Work & Study",
    displayName: "High-Speed Internet",
    icon: <Wifi className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  smart_home: {
    category: "Work & Study",
    displayName: "Smart Home Tech",
    icon: <Zap className="w-5 h-5" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 hover:bg-yellow-100",
  },
  study_room: {
    category: "Work & Study",
    displayName: "Study Room",
    icon: <Briefcase className="w-5 h-5" />,
    color: "text-gray-600",
    bgColor: "bg-gray-50 hover:bg-gray-100",
  },
  meeting_rooms: {
    category: "Work & Study",
    displayName: "Meeting Rooms",
    icon: <Briefcase className="w-5 h-5" />,
    color: "text-slate-600",
    bgColor: "bg-slate-50 hover:bg-slate-100",
  },

  // Convenience
  parking: {
    category: "Convenience",
    displayName: "Parking Available",
    icon: <Car className="w-5 h-5" />,
    color: "text-gray-600",
    bgColor: "bg-gray-50 hover:bg-gray-100",
  },
  bike_storage: {
    category: "Convenience",
    displayName: "Bike Storage",
    icon: <MapPin className="w-5 h-5" />,
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
  },
  laundry: {
    category: "Convenience",
    displayName: "Laundry Facilities",
    icon: <ShoppingCart className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  storage: {
    category: "Convenience",
    displayName: "Storage Space",
    icon: <Package className="w-5 h-5" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
  },
  parcel_room: {
    category: "Convenience",
    displayName: "Parcel Room",
    icon: <Package className="w-5 h-5" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
  },
  cleaning_service: {
    category: "Convenience",
    displayName: "Cleaning Service",
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-pink-600",
    bgColor: "bg-pink-50 hover:bg-pink-100",
  },

  // Pet-Friendly Features
  pet_friendly: {
    category: "Pet-Friendly Features",
    displayName: "Pet Friendly",
    icon: <PawPrint className="w-5 h-5" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50 hover:bg-amber-100",
  },
  dog_run: {
    category: "Pet-Friendly Features",
    displayName: "Dog Run Area",
    icon: <PawPrint className="w-5 h-5" />,
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
  },
  pet_grooming: {
    category: "Pet-Friendly Features",
    displayName: "Pet Grooming",
    icon: <PawPrint className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  pet_sitting: {
    category: "Pet-Friendly Features",
    displayName: "Pet Sitting Service",
    icon: <PawPrint className="w-5 h-5" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
  },

  // Luxury / Unique Perks
  concierge: {
    category: "Luxury / Unique Perks",
    displayName: "Concierge Service",
    icon: <Star className="w-5 h-5" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 hover:bg-yellow-100",
  },
  doorman: {
    category: "Luxury / Unique Perks",
    displayName: "24/7 Doorman",
    icon: <Shield className="w-5 h-5" />,
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100",
  },
  valet_parking: {
    category: "Luxury / Unique Perks",
    displayName: "Valet Parking",
    icon: <Car className="w-5 h-5" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
  },
  room_service: {
    category: "Luxury / Unique Perks",
    displayName: "Room Service",
    icon: <Utensils className="w-5 h-5" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
  },
  luxury_finishes: {
    category: "Luxury / Unique Perks",
    displayName: "Luxury Finishes",
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
  },
  garden: {
    category: "Luxury / Unique Perks",
    displayName: "Private Garden",
    icon: <TreePine className="w-5 h-5" />,
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
  },
  balcony: {
    category: "Luxury / Unique Perks",
    displayName: "Private Balcony",
    icon: <Building className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  terrace: {
    category: "Luxury / Unique Perks",
    displayName: "Private Terrace",
    icon: <Building className="w-5 h-5" />,
    color: "text-teal-600",
    bgColor: "bg-teal-50 hover:bg-teal-100",
  },
  restaurant: {
    category: "Luxury / Unique Perks",
    displayName: "On-site Restaurant",
    icon: <Utensils className="w-5 h-5" />,
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100",
  },
  cafe: {
    category: "Luxury / Unique Perks",
    displayName: "On-site Café",
    icon: <Coffee className="w-5 h-5" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50 hover:bg-amber-100",
  },
};

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-lg">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default function LifestyleFeatures({
  features,
  compact = false,
}: LifestyleFeaturesProps) {
  if (!features || features.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No lifestyle features listed for this property</p>
      </div>
    );
  }

  // Map features to their display information
  const mappedFeatures = features
    .map((feature) => {
      const featureKey = feature.toLowerCase().replace(/[\s-]/g, "_");
      const mapping = FEATURE_MAPPING[featureKey];

      if (mapping) {
        return {
          key: featureKey,
          ...mapping,
        };
      }

      // Fallback for unmapped features
      return {
        key: featureKey,
        category: "Other",
        displayName: feature
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        icon: <Home className="w-5 h-5" />,
        color: "text-gray-600",
        bgColor: "bg-gray-50 hover:bg-gray-100",
      };
    })
    .filter(Boolean);

  if (compact) {
    // Compact version for property cards - show first 6 features as icons only
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {mappedFeatures.slice(0, 6).map((feature) => (
          <Tooltip key={feature.key} content={feature.displayName}>
            <div
              className={`
              p-2 rounded-lg transition-colors cursor-help
              ${feature.bgColor} ${feature.color}
            `}
            >
              {feature.icon}
            </div>
          </Tooltip>
        ))}
        {mappedFeatures.length > 6 && (
          <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            +{mappedFeatures.length - 6}
          </div>
        )}
      </div>
    );
  }

  // Full version for property detail pages
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Lifestyle Features
        </h3>
        <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {mappedFeatures.length}
        </div>
      </div>

      {/* Icon Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {mappedFeatures.map((feature) => (
          <Tooltip key={feature.key} content={feature.displayName}>
            <div
              className={`
              flex flex-col items-center p-4 rounded-xl transition-all duration-200 cursor-help
              border border-gray-100 hover:border-gray-200 hover:shadow-md
              ${feature.bgColor} ${feature.color}
              group
            `}
            >
              <div className="mb-2 group-hover:scale-110 transition-transform duration-200">
                {feature.icon}
              </div>
              <span className="text-xs font-medium text-center leading-tight">
                {feature.displayName.length > 15
                  ? feature.displayName.slice(0, 12) + "..."
                  : feature.displayName}
              </span>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Feature categories summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(mappedFeatures.map((f) => f.category))).map(
            (category) => (
              <span
                key={category}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {category}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
