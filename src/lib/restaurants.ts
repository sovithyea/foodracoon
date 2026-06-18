import type { Tables } from "@/lib/database.types";

// The restaurant fields the Phase 1 map + panel actually need.
export type MapRestaurant = Pick<
  Tables<"restaurants">,
  | "id"
  | "name"
  | "address"
  | "district"
  | "latitude"
  | "longitude"
  | "cuisine_type"
  | "tags"
  | "price_range"
  | "google_rating"
  | "cover_photo_url"
>;

export const PHNOM_PENH_CENTER: [number, number] = [104.9282, 11.5564]; // [lng, lat]
export const DEFAULT_ZOOM = 12.5;

export function priceLabel(range: number | null): string {
  if (!range) return "—";
  return "$".repeat(Math.min(Math.max(range, 1), 4));
}
