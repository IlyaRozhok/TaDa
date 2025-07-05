"use client";

import React, { useState, useEffect } from "react";
import { Property, shortlistAPI } from "../lib/api";
import { useTranslations } from "../lib/language-context";
import { useRouter } from "next/navigation";
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Calendar,
  Home,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import LifestyleFeatures from "./LifestyleFeatures";

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
  showShortlist?: boolean;
}

export default function PropertyCard({
  property,
  onClick,
  showShortlist = true,
}: PropertyCardProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [shortlistError, setShortlistError] = useState<string | null>(null);
  const [shortlistSuccess, setShortlistSuccess] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Check shortlist status on component mount
  useEffect(() => {
    const checkShortlistStatus = async () => {
      if (!showShortlist || !property?.id) {
        setStatusLoading(false);
        return;
      }

      try {
        const status = await shortlistAPI.checkStatus(property.id);
        setIsShortlisted(status);
      } catch (error) {
        console.warn("Could not check shortlist status:", error);
        setIsShortlisted(false);
      } finally {
        setStatusLoading(false);
      }
    };

    checkShortlistStatus();
  }, [property?.id, showShortlist]);

  const formatPrice = (price: number) => {
    if (isNaN(price)) return "£0";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Available now";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "Available now";
    }
  };

  const getFirstImage = () => {
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTAwTDIwMCAxMjVMMjI1IDEwMEwyNTAgMTI1VjE2MEgxNTBWMTI1TDE3NSAxMDBaIiBmaWxsPSIjOUIxMDRGIi8+CjxjaXJjbGUgY3g9IjE4MCIgY3k9IjExMCIgcj0iOCIgZmlsbD0iIzlCMTA0RiIvPgo8L3N2Zz4K";
  };

  const getTopFeatures = () => {
    if (
      !property.lifestyle_features ||
      property.lifestyle_features.length === 0
    ) {
      return [];
    }
    return property.lifestyle_features
      .slice(0, 2)
      .map((feature) =>
        feature.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      );
  };

  const handleShortlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    if (!showShortlist || !property?.id) {
      return;
    }

    // Clear any existing messages
    setShortlistError(null);
    setShortlistSuccess(null);

    try {
      setShortlistLoading(true);

      if (isShortlisted) {
        await shortlistAPI.remove(property.id);
        setIsShortlisted(false);
        setShortlistSuccess("Property removed from shortlist");
      } else {
        await shortlistAPI.add(property.id);
        setIsShortlisted(true);
        setShortlistSuccess("Property added to shortlist");
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setShortlistSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error("Error updating shortlist in PropertyCard:", error);
      setShortlistError(error.message || "Failed to update shortlist");

      // Clear error after 3 seconds
      setTimeout(() => {
        setShortlistError(null);
      }, 3000);
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/app/properties/${property.id}`);
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-gray-200 relative">
      {/* Toast Notifications */}
      {(shortlistError || shortlistSuccess) && (
        <div className="absolute top-2 left-2 right-2 z-50 space-y-2">
          {shortlistError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg animate-slideInFromTop">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </div>
                <div className="ml-2">
                  <p className="text-xs text-red-800">{shortlistError}</p>
                </div>
                <div className="ml-auto pl-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShortlistError(null);
                    }}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {shortlistSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg animate-slideInFromTop">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <div className="ml-2">
                  <p className="text-xs text-green-800">{shortlistSuccess}</p>
                </div>
                <div className="ml-auto pl-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShortlistSuccess(null);
                    }}
                    className="text-green-400 hover:text-green-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Container */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={getFirstImage()}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTAwTDIwMCAxMjVMMjI1IDEwMEwyNTAgMTI1VjE2MEgxNTBWMTI1TDE3NSAxMDBaIiBmaWxsPSIjOUIxMDRGIi8+CjxjaXJjbGUgY3g9IjE4MCIgY3k9IjExMCIgcj0iOCIgZmlsbD0iIzlCMTA0RiIvPgo8L3N2Zz4K";
          }}
          onClick={handleCardClick}
        />

        {/* Price Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
          <span className="text-sm font-bold text-black">
            {formatPrice(property.price)}
            <span className="text-xs font-normal text-black">/mo</span>
          </span>
        </div>

        {/* BTR Badge */}
        {property.is_btr && (
          <div className="absolute top-3 right-12 bg-green-500 text-white px-2.5 py-1 rounded-md text-xs font-semibold">
            BTR
          </div>
        )}

        {/* Shortlist Toggle */}
        {showShortlist && (
          <div className="absolute top-3 right-3">
            <button
              onClick={handleShortlistToggle}
              disabled={shortlistLoading || statusLoading}
              className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
                statusLoading
                  ? "bg-gray-100 text-gray-400"
                  : isShortlisted
                  ? "bg-red-500 text-white shadow-lg hover:bg-red-600"
                  : "bg-white/95 text-gray-400 hover:text-red-500 shadow-sm hover:shadow-md"
              } disabled:opacity-50`}
              title={
                statusLoading
                  ? "Checking status..."
                  : isShortlisted
                  ? "Remove from shortlist"
                  : "Add to shortlist"
              }
            >
              {shortlistLoading || statusLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Heart
                  className={`w-4 h-4 ${isShortlisted ? "fill-current" : ""}`}
                />
              )}
            </button>
          </div>
        )}

        {/* Available Badge */}
        <div className="absolute bottom-3 left-3 bg-blue-500 text-white px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(property.available_from)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5" onClick={handleCardClick}>
        {/* Title */}
        <h3 className="text-lg font-semibold text-black mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {property.title}
        </h3>

        {/* Address */}
        <div className="flex items-center gap-1.5 mb-3 text-black">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{property.address}</span>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 mb-4 text-sm text-black">
          <div className="flex items-center gap-1.5">
            <Bed className="w-4 h-4" />
            <span>
              {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4" />
            <span>
              {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Home className="w-4 h-4" />
            <span className="capitalize">{property.property_type}</span>
          </div>
        </div>

        {/* Features */}
        {property.lifestyle_features &&
          property.lifestyle_features.length > 0 && (
            <div className="space-y-2">
              <LifestyleFeatures
                features={property.lifestyle_features}
                compact={true}
              />
            </div>
          )}

        {/* Operator */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-black">
            <span>
              Listed by {property.operator?.name || "Property Operator"}
            </span>
            <span className="text-black">•</span>
            <span>ID: {property.id.slice(-6)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
