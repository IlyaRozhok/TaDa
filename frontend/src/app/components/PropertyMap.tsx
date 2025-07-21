"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import L from "leaflet";

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface PropertyMapProps {
  address: string;
  title?: string;
  className?: string;
  height?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodingResponse {
  lat: string;
  lon: string;
  display_name: string;
}

// Create a custom marker icon
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 30px;
    height: 30px;
    background-color: #ef4444;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  ">
    <div style="
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 6px solid #ef4444;
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
    "></div>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  </div>`,
  iconSize: [30, 36],
  iconAnchor: [15, 36],
  popupAnchor: [0, -36],
});

export default function PropertyMap({
  address,
  title,
  className = "",
  height = "h-64",
}: PropertyMapProps) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Geocode address to coordinates using Nominatim (OpenStreetMap)
  const geocodeAddress = async (
    address: string
  ): Promise<Coordinates | null> => {
    try {
      // Clean and encode the address
      const encodedAddress = encodeURIComponent(address.trim());

      // Use Nominatim geocoding service (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`,
        {
          headers: {
            "User-Agent": "TaDa Property Platform",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data: GeocodingResponse[] = await response.json();

      if (data.length === 0) {
        throw new Error("Address not found");
      }

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!address) {
        setError("No address provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const coords = await geocodeAddress(address);
        setCoordinates(coords);
      } catch (err: any) {
        console.error("Failed to geocode address:", err);
        setError(err.message || "Failed to load map location");
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinates();
  }, [address]);

  // Loading state
  if (loading) {
    return (
      <div
        className={`${height} ${className} bg-gray-100 rounded-lg flex items-center justify-center`}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-500" />
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !coordinates) {
    return (
      <div
        className={`${height} ${className} bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300`}
      >
        <div className="text-center p-6">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 text-sm mb-2">Unable to load map</p>
          <p className="text-gray-500 text-xs">
            {error || "Location not found for this address"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${height} ${className} rounded-lg overflow-hidden border border-gray-200`}
    >
      <MapContainer
        center={[coordinates.lat, coordinates.lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={[coordinates.lat, coordinates.lng]}
          icon={customIcon}
        >
          <Popup>
            <div className="text-center p-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-gray-800">
                  Property Location
                </span>
              </div>
              {title && (
                <div className="font-medium text-gray-700 mb-1">{title}</div>
              )}
              <div className="text-gray-600 text-sm">{address}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

// Export a MapSkeleton for loading states
export function MapSkeleton({
  height = "h-64",
  className = "",
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`${height} ${className} bg-gray-200 rounded-lg animate-pulse flex items-center justify-center`}
    >
      <div className="text-center">
        <div className="w-8 h-8 bg-gray-300 rounded mx-auto mb-2"></div>
        <div className="w-20 h-3 bg-gray-300 rounded mx-auto"></div>
      </div>
    </div>
  );
}
