import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { inferDistrict } from "@/lib/places";
import { parseBody, checkOrigin, BadRequest } from "@/lib/request-guard";

const adminDb = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseBody<{
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
    district?: string;
    cuisine_type?: string[];
    tags?: string[];
    price_range?: number;
    suggestion_id?: string;
  }>(req, ["name", "latitude", "longitude", "address", "district", "cuisine_type", "tags", "price_range", "suggestion_id"]);

  if (!parsed.ok) return parsed.response;
  const { name, latitude, longitude, address, district, cuisine_type, tags, price_range, suggestion_id } = parsed.data;

  if (typeof name !== "string" || !name.trim()) return BadRequest("name is required");
  if (typeof latitude !== "number" || latitude < -90 || latitude > 90) return BadRequest("latitude must be a number between -90 and 90");
  if (typeof longitude !== "number" || longitude < -180 || longitude > 180) return BadRequest("longitude must be a number between -180 and 180");
  if (cuisine_type !== undefined && (!Array.isArray(cuisine_type) || cuisine_type.some((c) => typeof c !== "string"))) {
    return BadRequest("cuisine_type must be an array of strings");
  }
  if (tags !== undefined && (!Array.isArray(tags) || tags.some((t) => typeof t !== "string"))) {
    return BadRequest("tags must be an array of strings");
  }
  if (price_range !== undefined && price_range !== null) {
    if (!Number.isInteger(price_range) || price_range < 1 || price_range > 4) {
      return BadRequest("price_range must be an integer between 1 and 4");
    }
  }

  const { data: restaurant, error } = await adminDb
    .from("restaurants")
    .insert({
      google_place_id: null,
      name: name.trim(),
      address: address?.trim() ?? null,
      district: district ?? inferDistrict(latitude, longitude),
      latitude,
      longitude,
      cuisine_type: cuisine_type ?? ["International"],
      tags: tags ?? [],
      price_range: price_range ?? null,
      google_rating: null,
      google_rating_count: null,
      cover_photo_url: null,
      is_verified: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to add restaurant" }, { status: 500 });

  if (suggestion_id) {
    await adminDb
      .from("suggestions")
      .update({ status: "imported", imported_restaurant_id: restaurant.id })
      .eq("id", suggestion_id);
  }

  return NextResponse.json({ restaurant });
}
