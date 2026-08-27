import { Injectable, Logger } from "@nestjs/common";

/**
 * What a successful postcode lookup yields. `borough` is postcodes.io's
 * `admin_district` — the canonical London borough ("Camden", "Hackney"),
 * which is what tenants actually pick in their location preferences.
 */
export interface GeocodeResult {
  /** Normalized postcode, e.g. "NW1 8XY". */
  postcode: string;
  latitude: number;
  longitude: number;
  borough: string | null;
}

/**
 * UK postcode geocoding via postcodes.io (free, no key, ONS-backed —
 * authoritative for UK postcodes).
 *
 * Failure-tolerant by design: geocoding runs inside property writes, and a
 * third-party outage must never block an operator saving a listing. Every
 * failure path — bad postcode, timeout, network error, non-200 — resolves to
 * `null` and a warning log; callers store null coordinates and move on.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  private readonly baseUrl =
    process.env.POSTCODES_IO_URL || "https://api.postcodes.io";

  /** How long a lookup may hold up a property save. */
  private static readonly LOOKUP_TIMEOUT_MS = 3000;

  /**
   * Full UK postcode (outward + inward, e.g. "NW1 8XY", "EC1A 1BB"),
   * case-insensitive, space optional. Anchored per-token when extracting
   * from free text below.
   */
  private static readonly POSTCODE_PATTERN =
    /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

  /**
   * Pull a full UK postcode out of a free-text address and normalize it to
   * the canonical "OUTWARD INWARD" form. Returns null when the text carries
   * no full postcode (an outward code alone — "NW1" — is not enough to
   * geocode a building).
   */
  extractPostcode(text: string | null | undefined): string | null {
    if (!text) return null;
    const match = GeocodingService.POSTCODE_PATTERN.exec(text);
    if (!match) return null;
    return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
  }

  /**
   * Look a postcode up on postcodes.io. Accepts raw user input — it is
   * normalized (or extracted from surrounding text) first.
   */
  async lookupPostcode(raw: string | null | undefined): Promise<GeocodeResult | null> {
    const postcode = this.extractPostcode(raw);
    if (!postcode) return null;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      GeocodingService.LOOKUP_TIMEOUT_MS,
    );

    try {
      const res = await fetch(
        `${this.baseUrl}/postcodes/${encodeURIComponent(postcode)}`,
        { signal: controller.signal },
      );

      if (!res.ok) {
        // 404 = postcode does not exist; anything else is a service problem.
        if (res.status !== 404) {
          this.logger.warn(
            `postcodes.io lookup for "${postcode}" returned ${res.status}`,
          );
        }
        return null;
      }

      const body = (await res.json()) as {
        result?: {
          postcode?: string;
          latitude?: number | null;
          longitude?: number | null;
          admin_district?: string | null;
        };
      };

      const result = body?.result;
      if (
        !result ||
        typeof result.latitude !== "number" ||
        typeof result.longitude !== "number"
      ) {
        return null;
      }

      return {
        postcode: result.postcode ?? postcode,
        latitude: result.latitude,
        longitude: result.longitude,
        borough: result.admin_district ?? null,
      };
    } catch (error) {
      this.logger.warn(
        `postcodes.io lookup for "${postcode}" failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Geocode a property's location from an explicit postcode when one was
   * provided, falling back to whatever full postcode its address contains.
   */
  async geocode(
    address: string | null | undefined,
    explicitPostcode?: string | null,
  ): Promise<GeocodeResult | null> {
    return this.lookupPostcode(explicitPostcode || address);
  }
}
