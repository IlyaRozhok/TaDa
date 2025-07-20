import React from "react";
import Link from "next/link";
import { HomeCard } from "../types/featured";
import { Button } from "./ui/Button";
import { Building, MapPin, Star, Sparkles, Tag } from "lucide-react";

interface FeaturedCardProps {
  card: HomeCard;
}

const getBadgeStyles = (variant: "new" | "featured" | "popular") => {
  switch (variant) {
    case "new":
      return "bg-green-100 text-green-800 border-green-200";
    case "featured":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "popular":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getBadgeIcon = (variant: "new" | "featured" | "popular") => {
  switch (variant) {
    case "new":
      return <Sparkles className="w-3 h-3" />;
    case "featured":
      return <Star className="w-3 h-3" />;
    case "popular":
      return <Tag className="w-3 h-3" />;
    default:
      return null;
  }
};

const getCardIcon = (type: "property" | "residential-complex" | "info") => {
  switch (type) {
    case "property":
      return <Building className="w-5 h-5" />;
    case "residential-complex":
      return <Building className="w-5 h-5" />;
    case "info":
      return <Sparkles className="w-5 h-5" />;
    default:
      return <Building className="w-5 h-5" />;
  }
};

export default function FeaturedCard({ card }: FeaturedCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300">
      {/* Badge */}
      {card.badge && (
        <div className="absolute top-4 left-4 z-10">
          <div
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getBadgeStyles(
              card.badge.variant
            )}`}
          >
            {getBadgeIcon(card.badge.variant)}
            {card.badge.text}
          </div>
        </div>
      )}

      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={card.imageUrl}
          alt={card.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
            {getCardIcon(card.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-gray-700 transition-colors">
              {card.title}
            </h3>
            {card.subtitle && (
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{card.subtitle}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {card.description}
        </p>

        {/* Metadata */}
        {card.metadata && (
          <div className="mb-6">
            {card.metadata.price && (
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {card.metadata.price}
              </p>
            )}
            {card.metadata.features && (
              <div className="flex flex-wrap gap-2">
                {card.metadata.features.slice(0, 3).map((feature, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium"
                  >
                    {feature}
                  </span>
                ))}
                {card.metadata.features.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                    +{card.metadata.features.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href={card.primaryAction.url} className="flex-1">
            <Button
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              size="sm"
            >
              {card.primaryAction.text}
            </Button>
          </Link>
          {card.secondaryAction && (
            <Link href={card.secondaryAction.url}>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50"
              >
                {card.secondaryAction.text}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
