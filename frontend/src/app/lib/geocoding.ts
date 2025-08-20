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

    if (!address || address.trim().length === 0) {
      console.warn("Empty address provided for geocoding");
      return null;
    }

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

    // Clean and prepare address for better geocoding
    const cleanAddress = this.cleanAddress(address);
    console.log(`Cleaned address: "${cleanAddress}"`);

    try {
      const result = await Promise.race([
        new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          this.geocoder!.geocode(
            {
              address: cleanAddress,
              region: "UK", // Bias results to UK
              componentRestrictions: {
                country: "GB", // Restrict to Great Britain
              },
            },
            (results, status) => {
              console.log(`Geocoding API response for "${cleanAddress}":`, {
                status,
                resultsCount: results?.length,
                firstResult: results?.[0]?.formatted_address,
              });
              if (status === google.maps.GeocoderStatus.OK && results) {
                resolve(results);
              } else {
                reject(new Error(`Geocoding failed: ${status}`));
              }
            }
          );
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Geocoding timeout after 15 seconds")),
            15000
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

  async geocodeAddressWithRetry(
    address: string,
    maxRetries: number = 2
  ): Promise<GeocodingResult | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `🔄 Geocoding attempt ${attempt}/${maxRetries} for: "${address}"`
        );
        const result = await this.geocodeAddress(address);

        if (result) {
          console.log(`✅ Geocoding succeeded on attempt ${attempt}`);
          return result;
        } else {
          console.warn(`⚠️ Geocoding attempt ${attempt} returned null`);
        }
      } catch (error) {
        console.error(
          `❌ Geocoding attempt ${attempt} failed:`,
          error instanceof Error ? error.message : error
        );

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    console.error(`💥 All geocoding attempts failed for: "${address}"`);
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
            `Property ${property.id} (${property.title}) needs geocoding for address:`,
            property.address
          );
          try {
            // Try geocoding with retry mechanism
            const coords = await this.geocodeAddressWithRetry(
              property.address,
              2
            );
            if (coords) {
              console.log(`✅ Property ${property.id} geocoded successfully:`, {
                original: property.address,
                formatted: coords.formatted_address,
                coordinates: { lat: coords.lat, lng: coords.lng },
              });
              propertiesWithCoords.push({
                ...property,
                lat: coords.lat,
                lng: coords.lng,
                formatted_address: coords.formatted_address,
                place_id: coords.place_id,
              });
            } else {
              console.warn(
                `⚠️ Property ${property.id} geocoding returned null after retries, using fallback coordinates`
              );
              // If geocoding fails, use fallback coordinates
              const fallbackCoords = this.getFallbackCoordinates(
                property.address
              );
              propertiesWithCoords.push({
                ...property,
                lat: fallbackCoords.lat,
                lng: fallbackCoords.lng,
                geocoding_failed: true,
                original_address: property.address,
                fallback_reason: "geocoding_returned_null",
              });
            }
          } catch (error) {
            console.error(
              `❌ Failed to geocode property ${property.id} after retries:`,
              {
                error: error instanceof Error ? error.message : error,
                address: property.address,
              }
            );
            // Use fallback coordinates
            const fallbackCoords = this.getFallbackCoordinates(
              property.address
            );
            propertiesWithCoords.push({
              ...property,
              lat: fallbackCoords.lat,
              lng: fallbackCoords.lng,
              geocoding_failed: true,
              original_address: property.address,
              geocoding_error:
                error instanceof Error ? error.message : String(error),
              fallback_reason: "geocoding_error",
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

  private cleanAddress(address: string): string {
    // Clean and standardize address for better geocoding
    let cleaned = address.trim();

    // Ensure UK is at the end for better geocoding
    if (
      !cleaned.toLowerCase().includes("uk") &&
      !cleaned.toLowerCase().includes("united kingdom")
    ) {
      cleaned += ", UK";
    }

    // Replace common abbreviations with full forms
    const replacements = [
      { from: /\bst\b/gi, to: "Street" },
      { from: /\brd\b/gi, to: "Road" },
      { from: /\bave\b/gi, to: "Avenue" },
      { from: /\bln\b/gi, to: "Lane" },
      { from: /\bsq\b/gi, to: "Square" },
      { from: /\bpl\b/gi, to: "Place" },
      { from: /\bct\b/gi, to: "Court" },
      { from: /\bdr\b/gi, to: "Drive" },
    ];

    replacements.forEach((replacement) => {
      cleaned = cleaned.replace(replacement.from, replacement.to);
    });

    // Remove extra spaces and normalize
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
  }

  private getFallbackCoordinates(address: string): {
    lat: number;
    lng: number;
  } {
    // Generate consistent coordinates based on address hash with wider spread
    const hash = this.hashString(address);

    // London bounding box: roughly 51.28 to 51.69 lat, -0.51 to 0.33 lng
    const londonBounds = {
      latMin: 51.28,
      latMax: 51.69,
      lngMin: -0.51,
      lngMax: 0.33,
    };

    // Use hash to generate coordinates within London bounds
    const latRange = londonBounds.latMax - londonBounds.latMin; // ~0.41
    const lngRange = londonBounds.lngMax - londonBounds.lngMin; // ~0.84

    const lat = londonBounds.latMin + ((hash % 1000) / 1000) * latRange;
    const lng = londonBounds.lngMin + (((hash >> 10) % 1000) / 1000) * lngRange;

    console.log(`🔄 Generated fallback coordinates for "${address}":`, {
      lat: lat.toFixed(4),
      lng: lng.toFixed(4),
      hash: hash.toString(16),
    });

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
