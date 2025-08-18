"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  properties?: Array<{
    id: string;
    title: string;
    address?: string;
    price: number;
    lat?: number;
    lng?: number;
  }>;
  onPropertyClick?: (propertyId: string) => void;
  height?: string;
  className?: string;
}

export default function GoogleMap({
  center = { lat: 51.5074, lng: -0.1278 }, // London default
  zoom = 12,
  properties = [],
  onPropertyClick,
  height = "500px",
  className = "",
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load Google Maps API
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error("Google Maps API key is not configured");
        }

        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places"],
        });

        const google = await loader.load();

        if (!mapRef.current) return;

        // Create map instance
        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError("Failed to load map");
        setIsLoading(false);
      }
    };

    initMap();
  }, [center.lat, center.lng, zoom]);

  // Add markers when properties change
  useEffect(() => {
    if (!map || !properties.length) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];

    properties.forEach((property) => {
      if (property.lat && property.lng) {
        const marker = new google.maps.Marker({
          position: { lat: property.lat, lng: property.lng },
          map,
          title: property.title,
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#1F2937"/>
                <circle cx="16" cy="16" r="12" fill="#3B82F6"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16),
          },
        });

        // Add click listener
        marker.addListener("click", () => {
          if (onPropertyClick) {
            onPropertyClick(property.id);
          }
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3 max-w-xs">
              <h3 class="font-bold text-gray-900 mb-1">${property.title}</h3>
              ${
                property.address
                  ? `<p class="text-sm text-gray-600 mb-2">${property.address}</p>`
                  : ""
              }
              <p class="text-lg font-bold text-blue-600">£${property.price.toLocaleString()}/month</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);
  }, [map, properties, onPropertyClick]);

  if (error) {
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
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (isLoading) {
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
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg shadow-lg"
      />

      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2">
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
    </div>
  );
}
