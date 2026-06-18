import { createClient } from "@/lib/supabase/server";
import { MapView } from "@/components/map/MapView";
import type { MapRestaurant } from "@/lib/restaurants";

export default async function MapPage() {
  const supabase = await createClient();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select(
      "id, name, address, district, latitude, longitude, cuisine_type, tags, price_range, google_rating, cover_photo_url",
    )
    .order("name");

  return (
    <MapView
      restaurants={(restaurants as MapRestaurant[]) ?? []}
      savedIds={[]}
    />
  );
}
