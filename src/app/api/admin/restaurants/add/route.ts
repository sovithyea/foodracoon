import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { inferDistrict } from "@/lib/places";

const adminDb = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
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

  const body = await req.json();
  const { name, latitude, longitude, address, district, cuisine_type, tags, price_range, suggestion_id } = body;

  if (!name?.trim() || latitude == null || longitude == null) {
    return NextResponse.json(
      { error: "Name, latitude, and longitude are required" },
      { status: 400 },
    );
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (suggestion_id) {
    await adminDb
      .from("suggestions")
      .update({ status: "imported", imported_restaurant_id: restaurant.id })
      .eq("id", suggestion_id);
  }

  return NextResponse.json({ restaurant });
}
