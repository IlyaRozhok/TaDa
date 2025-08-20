"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store/slices/authSlice";
import TaDaMap from "../../../components/TaDaMap";
import { Property } from "../../../types";
import { propertiesAPI } from "../../../lib/api";
import { useRouter } from "next/navigation";
import { geocodingService } from "../../../lib/geocoding";

export default function PropertiesMapPage() {
  const user = useSelector(selectUser);
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGoogleMapsKey, setHasGoogleMapsKey] = useState(false);

  // Check if Google Maps API key is available
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setHasGoogleMapsKey(!!apiKey);
  }, []);

  // Wait for Google Maps to be ready
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);

  useEffect(() => {
    const checkGoogleMapsReady = () => {
      if (
        typeof window !== "undefined" &&
        window.google &&
        window.google.maps &&
        window.google.maps.Geocoder
      ) {
        console.log("🗺️ Google Maps API fully ready");
        setIsGoogleMapsReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkGoogleMapsReady()) {
      return;
    }

    // Poll for Google Maps readiness with shorter timeout
    let attempts = 0;
    const maxAttempts = 6; // 3 seconds max (6 attempts * 500ms)

    const checkInterval = setInterval(() => {
      attempts++;
      console.log(
        `🔄 Checking Google Maps API readiness... (${attempts}/${maxAttempts})`
      );

      if (checkGoogleMapsReady()) {
        clearInterval(checkInterval);
      } else if (attempts >= maxAttempts) {
        console.warn(
          "⚠️ Google Maps API timeout after 3s, proceeding with fallback coordinates"
        );
        clearInterval(checkInterval);
        setIsGoogleMapsReady(true); // Proceed anyway to avoid infinite loading
      }
    }, 500);

    // Cleanup
    return () => clearInterval(checkInterval);
  }, []);

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

        // Clean and validate property data
        const cleanedPropertiesData = propertiesData.map(
          (property: Property) => {
            // Fix incorrect addresses that contain property details instead of actual addresses
            let cleanAddress = property.address;
            if (cleanAddress) {
              // Check if address contains property details instead of actual address
              if (
                cleanAddress.includes("bed") ||
                cleanAddress.includes("bath") ||
                cleanAddress.includes("sq ft") ||
                cleanAddress.includes("•")
              ) {
                console.warn(
                  `⚠️ Property ${property.id} has incorrect address: "${cleanAddress}"`
                );
                cleanAddress = "London, UK"; // Fallback to generic address
              }
            } else {
              cleanAddress = "London, UK";
            }

            return {
              ...property,
              address: cleanAddress,
              original_address: property.address, // Keep original for reference
            };
          }
        );

        console.log("Cleaned properties data:", cleanedPropertiesData);

        if (cleanedPropertiesData.length > 0) {
          console.log("Properties found, checking geocoding availability...");

          // Check if Google Maps is ready for geocoding
          if (
            !isGoogleMapsReady ||
            !window.google ||
            !window.google.maps ||
            !window.google.maps.Geocoder
          ) {
            console.log(
              "⏳ Google Maps API not ready, using fallback coordinates"
            );
            // Use improved fallback coordinates if Maps isn't ready
            const fallbackProperties = cleanedPropertiesData.map(
              (property: Property) => {
                // Use hash-based fallback similar to geocoding service
                const hash = property.address
                  ? property.address.split("").reduce((a, b) => {
                      a = (a << 5) - a + b.charCodeAt(0);
                      return a & a;
                    }, 0)
                  : Math.floor(Math.random() * 1000);
                const lat = 51.28 + (Math.abs(hash % 1000) / 1000) * 0.41;
                const lng =
                  -0.51 + (Math.abs((hash >> 10) % 1000) / 1000) * 0.84;

                return {
                  ...property,
                  lat,
                  lng,
                  geocoding_failed: true,
                  fallback_reason: "maps_not_ready" as const,
                  original_address: property.address,
                };
              }
            );
            setProperties(fallbackProperties);
            return;
          }

          console.log("✅ Google Maps API ready, starting geocoding...");
          setIsGeocoding(true);

          try {
            // Google Maps is ready, proceed with geocoding
            console.log(
              "Google Maps API is fully loaded, proceeding with geocoding..."
            );

            // Verify geocoding service is available
            await geocodingService.initialize();
            console.log("Geocoding service initialized successfully");

            // Use geocoding service to get coordinates for all properties
            const propertiesWithCoords =
              await geocodingService.geocodeProperties(cleanedPropertiesData);
            console.log("Properties with coordinates:", propertiesWithCoords);

            // Count successful vs fallback geocoding
            const successfulGeocode = propertiesWithCoords.filter(
              (p) => !p.geocoding_failed
            ).length;
            const fallbackGeocode = propertiesWithCoords.filter(
              (p) => p.geocoding_failed
            ).length;
            console.log(
              `📊 Geocoding results: ${successfulGeocode} successful, ${fallbackGeocode} fallback`
            );

            setProperties(propertiesWithCoords);
          } catch (geocodingError) {
            console.error("Geocoding failed:", geocodingError);
            // Use fallback coordinates if geocoding fails
            const fallbackProperties = cleanedPropertiesData.map(
              (property: Property) => {
                const hash = property.address
                  ? property.address.split("").reduce((a, b) => {
                      a = (a << 5) - a + b.charCodeAt(0);
                      return a & a;
                    }, 0)
                  : Math.random() * 1000;
                const lat = 51.28 + (Math.abs(hash % 1000) / 1000) * 0.41;
                const lng =
                  -0.51 + (Math.abs((hash >> 10) % 1000) / 1000) * 0.84;

                return {
                  ...property,
                  lat,
                  lng,
                  geocoding_failed: true,
                  fallback_reason: "geocoding_error" as const,
                  original_address: property.address,
                  geocoding_error:
                    geocodingError instanceof Error
                      ? geocodingError.message
                      : String(geocodingError),
                };
              }
            );
            setProperties(fallbackProperties);
          } finally {
            setIsGeocoding(false);
          }
        } else {
          console.log("No properties from API, using mock data...");

          // Wait for Google Maps to be fully ready before geocoding mock data
          if (!isGoogleMapsReady) {
            console.log(
              "⏳ Google Maps API not ready for mock data, using simple fallback"
            );
            // Use simple fallback for mock data if Maps isn't ready
            const simpleMockProperties: Property[] = [
              {
                id: "1",
                title: "Test Property",
                description: "Sample test property",
                address: "Central London, UK",
                price: 3210,
                bedrooms: 1,
                bathrooms: 1,
                total_area: 497,
                property_type: "APARTMENT",
                furnishing: "Furnished",
                is_btr: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                operator_id: "1",
                lat: 51.5074,
                lng: -0.1278,
                geocoding_failed: true,
                fallback_reason: "maps_not_ready" as const,
              },
            ];
            setProperties(simpleMockProperties);
            return;
          }

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
          setIsGeocoding(true);

          // Check if Google Maps is loaded
          if (
            typeof window !== "undefined" &&
            window.google &&
            window.google.maps &&
            window.google.maps.Geocoder
          ) {
            console.log(
              "Google Maps API is fully loaded, proceeding with geocoding..."
            );
            try {
              // Verify geocoding service is available
              await geocodingService.initialize();
              console.log("Geocoding service initialized successfully");

              // Geocode mock properties as well
              const mockPropertiesWithCoords =
                await geocodingService.geocodeProperties(mockProperties);
              console.log(
                "Mock properties with coordinates:",
                mockPropertiesWithCoords
              );

              // Count successful vs fallback geocoding for mock data
              const successfulGeocode = mockPropertiesWithCoords.filter(
                (p) => !p.geocoding_failed
              ).length;
              const fallbackGeocode = mockPropertiesWithCoords.filter(
                (p) => p.geocoding_failed
              ).length;
              console.log(
                `📊 Mock geocoding results: ${successfulGeocode} successful, ${fallbackGeocode} fallback`
              );

              setProperties(mockPropertiesWithCoords);
            } catch (geocodingError) {
              console.error("Mock geocoding failed:", geocodingError);
              // Use fallback coordinates if geocoding fails
              const fallbackMockProperties = mockProperties.map(
                (property: Property, index: number) => ({
                  ...property,
                  lat: 51.5074 + index * 0.01,
                  lng: -0.1278 + index * 0.01,
                })
              );
              setProperties(fallbackMockProperties);
            } finally {
              setIsGeocoding(false);
            }
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
            setIsGeocoding(false);
          }
        }
      } catch (err) {
        console.error("Error loading properties:", err);
        setError("Failed to load properties");

        console.log("Using fallback mock data...");

        // Wait for Google Maps to be fully ready before geocoding error fallback data
        if (!isGoogleMapsReady) {
          console.log(
            "⏳ Google Maps API not ready for error fallback, using simple coordinates"
          );
          const simpleErrorProperties: Property[] = [
            {
              id: "1",
              title: "Sample Property",
              description: "Property data temporarily unavailable",
              address: "London, UK",
              price: 3210,
              bedrooms: 1,
              bathrooms: 1,
              total_area: 497,
              property_type: "APARTMENT",
              furnishing: "Furnished",
              is_btr: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              operator_id: "1",
              lat: 51.5074,
              lng: -0.1278,
              geocoding_failed: true,
              fallback_reason: "maps_not_ready" as const,
              geocoding_error: "Google Maps API not ready",
            },
          ];
          setProperties(simpleErrorProperties);
          return;
        }

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
          setIsGeocoding(true);

          // Check if Google Maps is loaded
          if (
            typeof window !== "undefined" &&
            window.google &&
            window.google.maps &&
            window.google.maps.Geocoder
          ) {
            console.log(
              "Google Maps API is fully loaded, proceeding with geocoding..."
            );
            try {
              // Verify geocoding service is available
              await geocodingService.initialize();
              console.log("Geocoding service initialized successfully");

              const mockPropertiesWithCoords =
                await geocodingService.geocodeProperties(mockProperties);
              console.log(
                "Fallback properties with coordinates:",
                mockPropertiesWithCoords
              );

              // Count successful vs fallback geocoding for fallback data
              const successfulGeocode = mockPropertiesWithCoords.filter(
                (p) => !p.geocoding_failed
              ).length;
              const fallbackGeocode = mockPropertiesWithCoords.filter(
                (p) => p.geocoding_failed
              ).length;
              console.log(
                `📊 Fallback geocoding results: ${successfulGeocode} successful, ${fallbackGeocode} fallback`
              );

              setProperties(mockPropertiesWithCoords);
            } catch (geocodingError) {
              console.error("Fallback geocoding failed:", geocodingError);
              // Use fallback coordinates if geocoding fails
              const fallbackProperties = mockProperties.map(
                (property: Property, index: number) => ({
                  ...property,
                  lat: 51.5074 + index * 0.01,
                  lng: -0.1278 + index * 0.01,
                })
              );
              setProperties(fallbackProperties);
            } finally {
              setIsGeocoding(false);
            }
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
            setIsGeocoding(false);
          }
        } catch (geocodingError) {
          console.error(
            "Geocoding failed, using fallback coordinates:",
            geocodingError
          );
          setIsGeocoding(true);
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
          setIsGeocoding(false);
        }
      } finally {
        console.log("Setting loading to false");
        setIsLoading(false);
      }
    };

    if (user) {
      console.log("User found, loading properties immediately...");
      loadProperties();
    } else {
      console.log("No user found");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Removed isGoogleMapsReady dependency to load data immediately

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
          <p className="text-gray-500 text-sm mt-2">Fetching property data</p>
        </div>
      </div>
    );
  }

  if (isGeocoding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Setting up map...</p>
          <p className="text-gray-500 text-sm mt-2">
            Processing property addresses for map display
          </p>
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
              {properties.length > 0 && (
                <div className="mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {properties.filter((p) => !p.geocoding_failed).length} exact
                  </span>
                  {properties.filter((p) => p.geocoding_failed).length > 0 && (
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      {properties.filter((p) => p.geocoding_failed).length}{" "}
                      approximate
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <TaDaMap
              center={{ lat: 51.5074, lng: -0.1278 }} // Лондон
              zoom={13}
              properties={properties}
              onPropertyClick={handlePropertyClick}
              height="600px"
              className="h-[600px]"
              showLoadingOverlay={false} // We handle loading at the page level
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
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-gray-900 flex-1">
                        {property.title}
                      </h4>
                      {property.geocoding_failed && (
                        <div className="flex items-center gap-1 ml-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          <span className="text-xs text-orange-600">~</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {property.formatted_address || property.address}
                      {property.original_address &&
                        property.original_address !== property.address && (
                          <span className="text-xs text-gray-400 block mt-1">
                            Original: {property.original_address}
                          </span>
                        )}
                    </p>
                    {property.geocoding_failed &&
                      property.fallback_reason === "maps_not_ready" && (
                        <p className="text-xs text-blue-500 mb-1">
                          ⏳ Address will be refined when map loads
                        </p>
                      )}
                    {property.geocoding_failed &&
                      property.fallback_reason === "geocoding_error" && (
                        <p className="text-xs text-orange-500 mb-1">
                          📍 Using approximate location
                        </p>
                      )}
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
                      {selectedProperty.formatted_address ||
                        selectedProperty.address}
                    </p>
                    {selectedProperty.geocoding_failed &&
                      selectedProperty.original_address && (
                        <p className="text-xs text-orange-600 mb-1">
                          📍 Approximate location based on:{" "}
                          {selectedProperty.original_address}
                        </p>
                      )}
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
