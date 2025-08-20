"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  useLoadScript,
  InfoWindow,
} from "@react-google-maps/api";
import { Property } from "../types";
import MapSetupInstructions from "./MapSetupInstructions";

interface TaDaMapProps {
  properties?: Property[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  onPropertyClick?: (propertyId: string) => void;
  className?: string;
  showLoadingOverlay?: boolean;
}

export default function TaDaMap({
  properties = [],
  center = { lat: 51.5074, lng: -0.1278 }, // Лондон по умолчанию
  zoom = 12,
  height = "500px",
  onPropertyClick,
  className = "",
  showLoadingOverlay = true,
}: TaDaMapProps) {
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Track loading state when properties change
  useEffect(() => {
    if (properties.length > 0) {
      setIsLoading(false);
    }
  }, [properties]);

  const handleMarkerMouseEnter = (property: Property) => {
    setHoveredProperty(property);
  };

  const handleMarkerMouseLeave = () => {
    setHoveredProperty(null);
  };

  const handleMarkerClick = (property: Property) => {
    if (onPropertyClick) {
      onPropertyClick(property.id);
    }
  };

  if (loadError) {
    console.error("Google Maps load error:", loadError);

    // Check if it's an API activation error
    if (
      loadError.message?.includes("ApiNotActivatedMapError") ||
      loadError.message?.includes("ApiNotActivated")
    ) {
      return <MapSetupInstructions />;
    }

    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-4 text-center ${className}`}
      >
        <div className="text-red-600 mb-2">
          <svg
            className="w-8 h-8 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <p className="text-red-800 font-medium">Map Error</p>
        <p className="text-red-600 text-sm">Failed to load Google Maps</p>
        <p className="text-red-500 text-xs mt-2">Error: {loadError.message}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-center ${className}`}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <GoogleMap
        zoom={zoom}
        center={center}
        mapContainerStyle={{ width: "100%", height }}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
        {/* Render markers for each property */}
        {properties.map((property) => {
          if (!property.lat || !property.lng) return null;

          // Convert coordinates to numbers if they're strings
          const lat = typeof property.lat === 'string' ? parseFloat(property.lat) : property.lat;
          const lng = typeof property.lng === 'string' ? parseFloat(property.lng) : property.lng;

          // Skip if coordinates are invalid
          if (isNaN(lat) || isNaN(lng)) return null;

          // Choose marker color based on geocoding status
          const markerColor = property.geocoding_failed ? "#F59E0B" : "#3B82F6"; // Orange for failed, Blue for success
          const markerOutline = property.geocoding_failed
            ? "#D97706"
            : "#1E40AF";

          return (
            <Marker
              key={property.id}
              position={{ lat, lng }}
              onClick={() => handleMarkerClick(property)}
              onMouseOver={() => handleMarkerMouseEnter(property)}
              onMouseOut={handleMarkerMouseLeave}
              icon={{
                url:
                  "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="${markerOutline}"/>
                    <circle cx="16" cy="16" r="12" fill="${markerColor}"/>
                    <circle cx="16" cy="16" r="6" fill="white"/>
                    ${
                      property.geocoding_failed
                        ? '<text x="16" y="21" text-anchor="middle" font-size="16" fill="white">!</text>'
                        : ""
                    }
                  </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16),
              }}
              title={
                property.geocoding_failed
                  ? `${property.title} (Approximate location)`
                  : property.title
              }
            />
          );
        })}

        {/* Info Window for hovered property */}
        {hoveredProperty && hoveredProperty.lat && hoveredProperty.lng && (() => {
          const lat = typeof hoveredProperty.lat === 'string' ? parseFloat(hoveredProperty.lat) : hoveredProperty.lat;
          const lng = typeof hoveredProperty.lng === 'string' ? parseFloat(hoveredProperty.lng) : hoveredProperty.lng;
          
          if (isNaN(lat) || isNaN(lng)) return null;
          
          return (
            <InfoWindow
              position={{ lat, lng }}
            options={{
              disableAutoPan: true,
              pixelOffset: new google.maps.Size(0, -40),
            }}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold text-gray-900 mb-1 text-sm">
                {hoveredProperty.title}
              </h3>
              {/* Show geocoding status */}
              {hoveredProperty.geocoding_failed && (
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                  <span className="text-xs text-orange-600 font-medium">
                    Approximate location
                  </span>
                </div>
              )}
              {/* Show address - prioritize formatted_address from geocoding */}
              <p className="text-xs text-gray-600 mb-2">
                {hoveredProperty.formatted_address || hoveredProperty.address}
                {hoveredProperty.original_address &&
                  hoveredProperty.original_address !==
                    hoveredProperty.address &&
                  hoveredProperty.original_address !==
                    hoveredProperty.formatted_address && (
                    <span className="text-xs text-gray-400 block mt-1">
                      Original: {hoveredProperty.original_address}
                    </span>
                  )}
              </p>
              <p className="text-sm font-bold text-blue-600">
                £{hoveredProperty.price.toLocaleString()}/month
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span>{hoveredProperty.bedrooms} bed</span>
                <span>•</span>
                <span>{hoveredProperty.bathrooms} bath</span>
                {hoveredProperty.total_area && (
                  <>
                    <span>•</span>
                    <span>{hoveredProperty.total_area} sq ft</span>
                  </>
                )}
              </div>
            </div>
          </InfoWindow>
          );
        })()}
      </GoogleMap>

      {/* Loading overlay */}
      {isLoading && showLoadingOverlay && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">
              Loading properties...
            </p>
            <p className="text-gray-500 text-sm">Setting up map markers</p>
          </div>
        </div>
      )}

      {/* Map controls and legend overlay */}
      <div className="absolute top-4 right-4 space-y-2">
        {/* Map controls */}
        <div className="bg-white rounded-lg shadow-md p-2">
          <button
            onClick={() => map?.panTo(center)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Reset to center"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </button>
        </div>

        {/* Legend */}
        {properties.some((p) => p.geocoding_failed) && (
          <div className="bg-white rounded-lg shadow-md p-3 text-xs">
            <h4 className="font-semibold text-gray-800 mb-2">Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Exact location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                <span className="text-gray-600">Approximate location</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
