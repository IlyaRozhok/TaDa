"use client";

import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  useLoadScript,
  InfoWindow,
} from "@react-google-maps/api";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import MapSetupInstructions from "./MapSetupInstructions";

interface PropertyMapGoogleProps {
  address: string;
  title?: string;
  className?: string;
  height?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

export default function PropertyMapGoogle({
  address,
  title = "Property Location",
  className = "",
  height = "400px",
}: PropertyMapGoogleProps) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || "",
    libraries: ["places"],
  });

  // Geocoding function using Google Maps Geocoding API
  const geocodeAddress = async (address: string): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error("Google Maps not loaded"));
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  };

  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!address) {
        setError("No address provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        if (isLoaded) {
          const coords = await geocodeAddress(address);
          setCoordinates(coords);
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to geocode address"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoordinates();
  }, [address, isLoaded]);

  // Check if API key is missing
  if (!apiKey) {
    return (
      <div
        className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center ${className}`}
      >
        <div className="text-yellow-600 mb-2">
          <AlertCircle className="w-8 h-8 mx-auto" />
        </div>
        <p className="text-yellow-800 font-medium">
          Google Maps API Key Missing
        </p>
        <p className="text-yellow-600 text-sm mb-2">
          Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
        </p>
        <p className="text-yellow-500 text-xs">
          See GOOGLE_MAPS_SETUP.md for instructions
        </p>
      </div>
    );
  }

  if (loadError) {
    console.error("Google Maps load error:", loadError);

    // Check if it's an API activation error
    if (
      loadError.message?.includes("ApiNotActivatedMapError") ||
      loadError.message?.includes("ApiNotActivated") ||
      loadError.message?.includes("InvalidKeyMapError")
    ) {
      return <MapSetupInstructions />;
    }

    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-4 text-center ${className}`}
      >
        <div className="text-red-600 mb-2">
          <AlertCircle className="w-8 h-8 mx-auto" />
        </div>
        <p className="text-red-800 font-medium">Map Error</p>
        <p className="text-red-600 text-sm">Failed to load Google Maps</p>
        <p className="text-red-500 text-xs mt-2">Error: {loadError.message}</p>
        <p className="text-red-500 text-xs mt-1">
          API Key: {apiKey ? `${apiKey.substring(0, 10)}...` : "Not set"}
        </p>
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

  if (isLoading) {
    return (
      <div
        className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-center ${className}`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-gray-600">Finding location...</p>
        <p className="text-gray-500 text-sm">{address}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center ${className}`}
      >
        <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
        <p className="text-yellow-800 font-medium">Location Not Found</p>
        <p className="text-yellow-600 text-sm mb-2">{error}</p>
        <p className="text-yellow-500 text-xs">Address: {address}</p>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div
        className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-center ${className}`}
      >
        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No coordinates available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <GoogleMap
        zoom={15}
        center={coordinates}
        mapContainerStyle={{ width: "100%", height }}
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
        <Marker
          position={coordinates}
          onClick={() => setShowInfoWindow(true)}
          icon={{
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="#1E40AF"/>
                  <circle cx="16" cy="16" r="12" fill="#3B82F6"/>
                  <circle cx="16" cy="16" r="6" fill="white"/>
                </svg>
              `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16),
          }}
          title={title}
        />

        {showInfoWindow && (
          <InfoWindow
            position={coordinates}
            onCloseClick={() => setShowInfoWindow(false)}
            options={{
              disableAutoPan: true,
              pixelOffset: new google.maps.Size(0, -40),
            }}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold text-gray-900 mb-1 text-sm">{title}</h3>
              <p className="text-xs text-gray-600 mb-2">{address}</p>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <MapPin className="w-3 h-3" />
                <span>Property Location</span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Address display */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-gray-700 truncate">{address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
