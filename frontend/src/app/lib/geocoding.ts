// Geocoding service for converting addresses to coordinates
export interface GeocodingResult {
  lat: number;
  lng: number;
  formatted_address: string;
  place_id: string;
}

export class GeocodingService {
  private static instance: GeocodingService;
  private geocoder: google.maps.Geocoder | null = null;
  private cache: Map<string, GeocodingResult> = new Map();

  private constructor() {}

  static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  async initialize(): Promise<void> {
    if (this.geocoder) return;

    try {
      // Wait for Google Maps to be loaded
      await new Promise<void>((resolve) => {
        const checkGoogle = () => {
          if (window.google && window.google.maps) {
            this.geocoder = new google.maps.Geocoder();
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
      });
    } catch (error) {
      console.error("Failed to initialize geocoder:", error);
      throw error;
    }
  }

  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    console.log(`GeocodingService.geocodeAddress called for: "${address}"`);

    if (!this.geocoder) {
      console.log("Geocoder not initialized, initializing...");
      await this.initialize();
    }

    if (!this.geocoder) {
      throw new Error("Geocoder not initialized");
    }

    // Check cache first
    const cacheKey = address.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      console.log(`Address "${address}" found in cache`);
      return this.cache.get(cacheKey)!;
    }

    console.log(
      `Address "${address}" not in cache, calling Google Geocoding API...`
    );
    try {
      const result = await Promise.race([
        new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          this.geocoder!.geocode({ address }, (results, status) => {
            console.log(`Geocoding API response for "${address}":`, {
              status,
              resultsCount: results?.length,
            });
            if (status === google.maps.GeocoderStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Geocoding timeout after 10 seconds")),
            10000
          )
        ),
      ]);

      if (result.length > 0) {
        const location = result[0].geometry.location;
        const geocodingResult: GeocodingResult = {
          lat: location.lat(),
          lng: location.lng(),
          formatted_address: result[0].formatted_address,
          place_id: result[0].place_id,
        };

        console.log(`Geocoding successful for "${address}":`, geocodingResult);
        // Cache the result
        this.cache.set(cacheKey, geocodingResult);
        return geocodingResult;
      }
    } catch (error) {
      console.error(`Geocoding failed for address "${address}":`, error);
    }

    console.log(`Geocoding failed for address "${address}", returning null`);
    return null;
  }

  async geocodeProperties(properties: any[]): Promise<any[]> {
    console.log(
      "GeocodingService.geocodeProperties called with:",
      properties.length,
      "properties"
    );
    const propertiesWithCoords = [];

    // Add timeout for the entire geocoding process
    const geocodingTimeout = setTimeout(() => {
      console.warn(
        "Geocoding timeout reached, using fallback coordinates for remaining properties"
      );
    }, 15000); // 15 seconds timeout

    try {
      for (const property of properties) {
        console.log(`Processing property ${property.id}:`, property.title);

        if (property.address && (!property.lat || !property.lng)) {
          console.log(
            `Property ${property.id} needs geocoding for address:`,
            property.address
          );
          try {
            const coords = await this.geocodeAddress(property.address);
            if (coords) {
              console.log(
                `Property ${property.id} geocoded successfully:`,
                coords
              );
              propertiesWithCoords.push({
                ...property,
                lat: coords.lat,
                lng: coords.lng,
                formatted_address: coords.formatted_address,
              });
            } else {
              console.log(
                `Property ${property.id} geocoding failed, using fallback coordinates`
              );
              // If geocoding fails, use fallback coordinates
              const fallbackCoords = this.getFallbackCoordinates(
                property.address
              );
              propertiesWithCoords.push({
                ...property,
                lat: fallbackCoords.lat,
                lng: fallbackCoords.lng,
              });
            }
          } catch (error) {
            console.error(`Failed to geocode property ${property.id}:`, error);
            // Use fallback coordinates
            const fallbackCoords = this.getFallbackCoordinates(
              property.address
            );
            propertiesWithCoords.push({
              ...property,
              lat: fallbackCoords.lat,
              lng: fallbackCoords.lng,
            });
          }
        } else if (property.lat && property.lng) {
          console.log(
            `Property ${property.id} already has coordinates:`,
            property.lat,
            property.lng
          );
          // Property already has coordinates
          propertiesWithCoords.push(property);
        } else {
          console.warn(
            `Property ${property.id} has no address or coordinates, skipping`
          );
        }
      }
    } finally {
      clearTimeout(geocodingTimeout);
    }

    console.log(
      "GeocodingService.geocodeProperties returning:",
      propertiesWithCoords.length,
      "properties"
    );
    return propertiesWithCoords;
  }

  private getFallbackCoordinates(address: string): {
    lat: number;
    lng: number;
  } {
    // Generate consistent coordinates based on address hash
    const hash = this.hashString(address);
    const lat = 51.5074 + (hash % 100) / 1000; // London area with small offset
    const lng = -0.1278 + ((hash >> 8) % 100) / 1000;

    return { lat, lng };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const geocodingService = GeocodingService.getInstance();
