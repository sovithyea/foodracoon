import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MapView } from "@/components/map/MapView";
import type { MapRestaurant } from "@/lib/restaurants";

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Gate first entry on onboarding (username set).
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.username) redirect("/onboarding");

  const [{ data: restaurants }, { data: saved }] = await Promise.all([
    supabase
      .from("restaurants")
      .select(
        "id, name, address, district, latitude, longitude, cuisine_type, tags, price_range, google_rating, cover_photo_url",
      )
      .order("name"),
    supabase
      .from("user_restaurants")
      .select("restaurant_id")
      .eq("user_id", user.id),
  ]);

  return (
    <MapView
      restaurants={(restaurants as MapRestaurant[]) ?? []}
      savedIds={(saved ?? []).map((s) => s.restaurant_id)}
    />
  );
}
