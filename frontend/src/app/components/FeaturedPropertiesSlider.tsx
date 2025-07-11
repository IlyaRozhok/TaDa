"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { propertiesAPI, Property } from "../lib/api";

// Helper function to generate random match percentage and status
const generateRandomData = () => ({
  matchPercent: Math.floor(Math.random() * 30) + 70, // 70-99%
  isPopular: Math.random() > 0.6, // 40% chance
  isNew: Math.random() > 0.7, // 30% chance
});

// Helper function to get the first image from property media
const getFirstImage = (property: Property) => {
  // Use media if available
  if (property.media && property.media.length > 0) {
    const featuredImage = property.media.find(
      (item) => item.is_featured && item.type === "image"
    );
    if (featuredImage) {
      return featuredImage.url;
    }

    // If no featured image, use first image
    const firstImage = property.media
      .filter((item) => item.type === "image")
      .sort((a, b) => a.order_index - b.order_index)[0];
    if (firstImage) {
      return firstImage.url;
    }
  }

  // Fallback to deprecated images array
  if (property.images && property.images.length > 0) {
    return property.images[0];
  }

  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTAwTDIwMCAxMjVMMjI1IDEwMEwyNTAgMTI1VjE2MEgxNTBWMTI1TDE3NSAxMDBaIiBmaWxsPSIjOUIxMDRGIi8+PGNpcmNsZSBjeD0iMTgwIiBjeT0iMTEwIiByPSI4IiBmaWxsPSIjOUIxMDRGIi8+PC9zdmc+";
};

interface PropertyCardProps {
  property: Property;
  randomData: {
    matchPercent: number;
    isPopular: boolean;
    isNew: boolean;
  };
  onClick: (property: Property) => void;
}

const FeaturedPropertyCard: React.FC<PropertyCardProps> = ({
  property,
  randomData,
  onClick,
}) => {
  return (
    <div
      className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
      onClick={() => onClick(property)}
    >
      {/* Property Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={getFirstImage(property)}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges in top right corner */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {/* Match percentage - always shown */}
          <div className="bg-white/95 backdrop-blur-sm text-green-700 px-3 py-1 rounded-full text-sm font-bold border border-green-200">
            Matched {randomData.matchPercent}%
          </div>

          {/* Popular badge */}
          {randomData.isPopular && (
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              🔥 Popular
            </div>
          )}

          {/* New badge */}
          {randomData.isNew && (
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              🆕 New
            </div>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {property.title}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-1">
          {property.address}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <span>
              {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
            </span>
            <span>
              {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
            </span>
            <span className="capitalize">{property.property_type}</span>
          </div>

          <div className="text-xl font-bold text-gray-900">
            £{property.price.toLocaleString()}
            <span className="text-sm font-normal text-gray-600">/mo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FeaturedPropertiesSlider() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [properties, setProperties] = useState<Property[]>([]);
  const [randomDataMap, setRandomDataMap] = useState<{[key: string]: {matchPercent: number, isPopular: boolean, isNew: boolean}}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await propertiesAPI.getFeatured(6);
        const propertiesData = response.data || response;
        
        setProperties(propertiesData);
        
        // Generate random data for each property
        const randomData: {[key: string]: any} = {};
        propertiesData.forEach((property: Property) => {
          randomData[property.id] = generateRandomData();
        });
        setRandomDataMap(randomData);
        
      } catch (err: any) {
        console.error("Error fetching featured properties:", err);
        setError("Failed to load featured properties");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProperties();
  }, []);
  
  const handlePropertyClick = (property: Property) => {
    router.push(`/app/properties/${property.id}`);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % properties.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + properties.length) % properties.length
    );
  };

    // Calculate visible properties based on screen size
  const getVisibleProperties = () => {
    if (properties.length === 0) return [];
    
    const visibleCount = Math.min(3, properties.length); // Show up to 3 properties at once
    const result = [];
    
    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % properties.length;
      result.push(properties[index]);
    }
    
    return result;
  };

  if (loading) {
    return (
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Featured Properties
          </h2>
          <button
            onClick={() => router.push("/app/properties")}
            className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            View All
          </button>
        </div>

        {/* Loading State */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-5">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Featured Properties
          </h2>
          <button
            onClick={() => router.push("/app/properties")}
            className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            View All
          </button>
        </div>

        {/* Error State */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Featured Properties</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Featured Properties
          </h2>
          <button
            onClick={() => router.push("/app/properties")}
            className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            View All
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No Featured Properties Available
          </h3>
          <p className="text-slate-600">
            Check back later for new featured listings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Featured Properties
        </h2>
        <button
          onClick={() => router.push("/app/properties")}
          className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          View All
        </button>
      </div>

      {/* Slider Container */}
      <div className="relative overflow-hidden">
        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getVisibleProperties().map((property) => (
            <FeaturedPropertyCard
              key={`${property.id}-${currentIndex}`}
              property={property}
              randomData={randomDataMap[property.id] || generateRandomData()}
              onClick={handlePropertyClick}
            />
          ))}
        </div>

        {/* Navigation Buttons - only show if we have more than 3 properties */}
        {properties.length > 3 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-200 z-10"
              aria-label="Previous properties"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-200 z-10"
              aria-label="Next properties"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator - only show if we have more than 3 properties */}
      {properties.length > 3 && (
        <div className="flex justify-center mt-6 gap-2">
          {properties.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "bg-blue-600"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to property ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
