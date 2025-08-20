"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store/slices/authSlice";
import TaDaMap from "../../../components/TaDaMap";
import TenantUniversalHeader from "../../../components/TenantUniversalHeader";
import { Property } from "../../../types";
import { propertiesAPI } from "../../../lib/api";
import { useRouter } from "next/navigation";
import { geocodingService } from "../../../lib/geocoding";
import { useDebounce } from "../../../hooks/useDebounce";

export default function PropertiesMapPage() {
  const user = useSelector(selectUser);
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasGoogleMapsKey, setHasGoogleMapsKey] = useState(false);

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Check if Google Maps API key is available
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setHasGoogleMapsKey(!!apiKey);
  }, []);

  // Filter properties based on search term
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const filtered = properties.filter((property) => {
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        property.title?.toLowerCase().includes(searchLower) ||
        property.address?.toLowerCase().includes(searchLower) ||
        property.description?.toLowerCase().includes(searchLower) ||
        property.property_type?.toLowerCase().includes(searchLower) ||
        property.furnishing?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredProperties(filtered);
  }, [debouncedSearchTerm, properties]);

  // Load properties from API
  useEffect(() => {
    const loadProperties = async () => {
      try {
        console.log("Starting to load properties...");
        setIsLoading(true);
        setError(null);

        // Try to get all properties
        console.log("Calling propertiesAPI.getAll()...");
        const response = await propertiesAPI.getAll();
        console.log("API response:", response);

        const propertiesData = response.data?.data || response.data || [];
        console.log("Properties data:", propertiesData);

        if (propertiesData.length > 0) {
          console.log("Properties found, starting geocoding...");

          // Check if Google Maps is loaded
          if (
            typeof window !== "undefined" &&
            window.google &&
            window.google.maps
          ) {
            console.log(
              "Google Maps API is loaded, proceeding with geocoding..."
            );
            // Use geocoding service to get coordinates for all properties
            const propertiesWithCoords =
              await geocodingService.geocodeProperties(propertiesData);
            console.log("Properties with coordinates:", propertiesWithCoords);
            setProperties(propertiesWithCoords);
            setFilteredProperties(propertiesWithCoords);
          } else {
            console.log(
              "Google Maps API not loaded, using fallback coordinates..."
            );
            // Use fallback coordinates if Google Maps is not loaded
            const fallbackProperties = propertiesData.map(
              (property: Property, index: number) => ({
                ...property,
                lat: 51.5074 + index * 0.01,
                lng: -0.1278 + index * 0.01,
              })
            );
            setProperties(fallbackProperties);
            setFilteredProperties(fallbackProperties);
            setFilteredProperties(fallbackProperties);
          }
        } else {
          console.log("No properties from API, using mock data...");
          // If no properties from API, use fallback mock data
          const mockProperties: Property[] = [
            {
              id: "1",
              title: "Kings Cross Apartments",
              description: "Modern apartment in Kings Cross, London",
              address: "37 Swinton Street, Camden, London, WC1X 9NT",
              price: 1712,
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
              description: "Spacious flat in Camden Town, London",
              address: "22 Brecknock Road, Camden, London, NW1 0AR",
              price: 1500,
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
              description: "Cozy studio near St Pancras, London",
              address: "1A Pancras Square, London, N1C 4AG",
              price: 1800,
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

          console.log("Geocoding mock properties...");

          // Check if Google Maps is loaded
          if (
            typeof window !== "undefined" &&
            window.google &&
            window.google.maps
          ) {
            console.log(
              "Google Maps API is loaded, proceeding with geocoding..."
            );
            // Geocode mock properties as well
            const mockPropertiesWithCoords =
              await geocodingService.geocodeProperties(mockProperties);
            console.log(
              "Mock properties with coordinates:",
              mockPropertiesWithCoords
            );
            setProperties(mockPropertiesWithCoords);
            setFilteredProperties(mockPropertiesWithCoords);
          } else {
            console.log(
              "Google Maps API not loaded, using fallback coordinates for mock properties..."
            );
            // Use fallback coordinates if Google Maps is not loaded
            const fallbackMockProperties = mockProperties.map(
              (property: Property, index: number) => ({
                ...property,
                lat: 51.5074 + index * 0.01,
                lng: -0.1278 + index * 0.01,
              })
            );
            setProperties(fallbackMockProperties);
            setFilteredProperties(fallbackMockProperties);
          }
        }
      } catch (err) {
        console.error("Error loading properties:", err);
        setError("Failed to load properties");

        console.log("Using fallback mock data...");
        // Fallback to mock data with geocoding
        const mockProperties: Property[] = [
          {
            id: "1",
            title: "Kings Cross Apartments",
            description: "Modern apartment in Kings Cross, London",
            address: "37 Swinton Street, Camden, London, WC1X 9NT",
            price: 1712,
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
            description: "Spacious flat in Camden Town, London",
            address: "22 Brecknock Road, Camden, London, NW1 0AR",
            price: 1500,
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
            description: "Cozy studio near St Pancras, London",
            address: "1A Pancras Square, London, N1C 4AG",
            price: 1800,
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

        try {
          console.log("Geocoding fallback properties...");

          // Check if Google Maps is loaded
          if (
            typeof window !== "undefined" &&
            window.google &&
            window.google.maps
          ) {
            console.log(
              "Google Maps API is loaded, proceeding with geocoding..."
            );
            const mockPropertiesWithCoords =
              await geocodingService.geocodeProperties(mockProperties);
            console.log(
              "Fallback properties with coordinates:",
              mockPropertiesWithCoords
            );
            setProperties(mockPropertiesWithCoords);
            setFilteredProperties(mockPropertiesWithCoords);
          } else {
            console.log(
              "Google Maps API not loaded, using fallback coordinates..."
            );
            // Use fallback coordinates if Google Maps is not loaded
            const fallbackProperties = mockProperties.map(
              (property: Property, index: number) => ({
                ...property,
                lat: 51.5074 + index * 0.01,
                lng: -0.1278 + index * 0.01,
              })
            );
            console.log("Using fallback coordinates:", fallbackProperties);
            setProperties(fallbackProperties);
            setFilteredProperties(fallbackProperties);
            setFilteredProperties(fallbackProperties);
          }
        } catch (geocodingError) {
          console.error(
            "Geocoding failed, using fallback coordinates:",
            geocodingError
          );
          // Use fallback coordinates if geocoding fails
          const fallbackProperties = mockProperties.map(
            (property: Property, index: number) => ({
              ...property,
              lat: 51.5074 + index * 0.01,
              lng: -0.1278 + index * 0.01,
            })
          );
          console.log("Using fallback coordinates:", fallbackProperties);
          setProperties(fallbackProperties);
          setFilteredProperties(fallbackProperties);
        }
      } finally {
        console.log("Setting loading to false");
        setIsLoading(false);
      }
    };

    if (user) {
      console.log("User found, loading properties...");
      loadProperties();
    } else {
      console.log("No user found");
    }
  }, [user]);

  const handlePropertyClick = (propertyId: string) => {
    const property = filteredProperties.find((p) => p.id === propertyId);
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
      <TenantUniversalHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        preferencesCount={0}
      />

      {/* Page Title */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              {filteredProperties.length} of {properties.length} properties
              shown
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <TaDaMap
              center={{ lat: 51.5074, lng: -0.1278 }} // Лондон
              zoom={13}
              properties={filteredProperties}
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
                {filteredProperties.map((property) => (
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
