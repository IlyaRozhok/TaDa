"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store/slices/authSlice";
import GoogleMap from "../../../components/GoogleMap";
import { Property } from "../../../types";
import { propertiesAPI } from "../../../lib/api";
import { useRouter } from "next/navigation";

export default function PropertiesMapPage() {
  const user = useSelector(selectUser);
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasGoogleMapsKey, setHasGoogleMapsKey] = useState(false);

  // Check if Google Maps API key is available
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setHasGoogleMapsKey(!!apiKey);
  }, []);

  // Load properties from API
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get all properties
        const response = await propertiesAPI.getAll();
        const propertiesData = response.data?.data || response.data || [];

        // Filter properties that have coordinates
        const propertiesWithCoords = propertiesData.filter(
          (property: Property) => property.lat && property.lng
        );

        // If no properties with coordinates, add mock coordinates to some properties
        if (propertiesWithCoords.length === 0 && propertiesData.length > 0) {
          const propertiesWithMockCoords = propertiesData
            .slice(0, 5)
            .map((property: Property, index: number) => ({
              ...property,
              lat: 51.532 + index * 0.01, // London area with slight offset
              lng: -0.125 + index * 0.01,
            }));
          setProperties(propertiesWithMockCoords);
        } else {
          setProperties(propertiesWithCoords);
        }
      } catch (err) {
        console.error("Error loading properties:", err);
        setError("Failed to load properties");

        // Fallback to mock data
        const mockProperties: Property[] = [
          {
            id: "1",
            title: "Kings Cross Apartments",
            description: "Modern apartment in Kings Cross",
            address: "37 Swinton Street, Camden, London, WC1X 9NT",
            price: 1712,
            lat: 51.532,
            lng: -0.1233,
            bedrooms: 1,
            bathrooms: 1,
            total_area: 497,
            property_type: "APARTMENT",
            furnishing: "Furnished",
            is_btr: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            operator_id: "1",
          },
          {
            id: "2",
            title: "Camden Town Flats",
            description: "Spacious flat in Camden",
            address: "22 Brecknock Road, Camden, London, NW1 0AR",
            price: 1500,
            lat: 51.54,
            lng: -0.142,
            bedrooms: 2,
            bathrooms: 1,
            total_area: 600,
            property_type: "APARTMENT",
            furnishing: "Partially Furnished",
            is_btr: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            operator_id: "1",
          },
          {
            id: "3",
            title: "St Pancras Studios",
            description: "Cozy studio near St Pancras",
            address: "1A Pancras Square, London, N1C 4AG",
            price: 1800,
            lat: 51.5325,
            lng: -0.125,
            bedrooms: 1,
            bathrooms: 1,
            total_area: 550,
            property_type: "APARTMENT",
            furnishing: "Furnished",
            is_btr: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            operator_id: "1",
          },
        ];
        setProperties(mockProperties);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProperties();
    }
  }, [user]);

  const handlePropertyClick = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
    }
  };

  const handleCloseProperty = () => {
    setSelectedProperty(null);
  };

  const handleViewProperty = (propertyId: string) => {
    router.push(`/app/properties/${propertyId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-500">
            Please log in to view the properties map
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Properties
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!hasGoogleMapsKey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-yellow-600"
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
              <h3 className="text-lg font-semibold text-yellow-800">
                Google Maps API Key Required
              </h3>
            </div>
            <p className="text-yellow-700 mb-4">
              To display the interactive map, you need to set up a Google Maps
              API key. Please follow the setup instructions in the
              documentation.
            </p>
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Quick Setup:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>
                  Get API key from{" "}
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </li>
                <li>
                  Add to your{" "}
                  <code className="bg-gray-100 px-1 rounded">.env.local</code>{" "}
                  file:
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded block mt-1">
                    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
                  </code>
                </li>
                <li>Restart your development server</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/app/properties")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Properties List
              </button>
              <a
                href="/GOOGLE_MAPS_SETUP.md"
                target="_blank"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Properties Map
              </h1>
              <p className="text-gray-600">
                Explore properties on an interactive map
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {properties.length} properties found
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <GoogleMap
              center={{ lat: 51.532, lng: -0.125 }} // Kings Cross area
              zoom={14}
              properties={properties}
              onPropertyClick={handlePropertyClick}
              height="600px"
              className="h-[600px]"
            />
          </div>

          {/* Properties List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Properties
              </h3>

              <div className="space-y-3">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedProperty?.id === property.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedProperty(property)}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">
                      {property.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {property.address}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {property.bedrooms} bed • {property.bathrooms} bath
                      </span>
                      <span className="font-semibold text-blue-600">
                        £{property.price.toLocaleString()}/month
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Property Details Modal */}
        {selectedProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedProperty.title}
                  </h3>
                  <button
                    onClick={handleCloseProperty}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 mb-2">
                      {selectedProperty.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-500">
                      {selectedProperty.bedrooms} Bedrooms
                    </span>
                    <span className="text-gray-500">
                      {selectedProperty.bathrooms} Bathrooms
                    </span>
                    {selectedProperty.total_area && (
                      <span className="text-gray-500">
                        {selectedProperty.total_area.toLocaleString()} sq ft
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedProperty.property_type && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {selectedProperty.property_type}
                      </span>
                    )}
                    {selectedProperty.furnishing && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {selectedProperty.furnishing}
                      </span>
                    )}
                    {selectedProperty.is_btr && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Built to Rent
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-3xl font-bold text-blue-600">
                      £{selectedProperty.price.toLocaleString()}
                    </div>
                    <div className="text-gray-500">per month</div>
                  </div>

                  <button
                    onClick={() => handleViewProperty(selectedProperty.id)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
