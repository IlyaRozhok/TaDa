// The one Property tree lives in ./property; this barrel only re-exports it.
// The old catalogue-side copy that used to live here declared a page of
// fields the backend never served (lat/lng, is_btr, total_area, geocoding
// fields, uppercase enums…) — step 5.2 folded it into the canonical type.
export type { Property, PropertyMedia } from "./property";

export interface UploadResponse {
  url: string;
  key: string;
  message?: string;
}

// Re-export Preferences from shared types
export type { Preferences } from "@/types/preferences";
