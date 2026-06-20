import { createClient } from "@/lib/supabase/server";
import { MapView } from "@/components/map/MapView";
import type { MapRestaurant } from "@/lib/restaurants";
import type { RestaurantStatus } from "@/store/mapStore";

const RESTAURANT_SELECT =
  "id, name, address, district, google_place_id, latitude, longitude, cuisine_type, tags, price_range, google_rating, google_rating_count, cover_photo_url";
const PAGE_SIZE = 1000;

export default async function MapPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // PostgREST max_rows is 1000 — paginate in parallel to fetch all restaurants.
  const { count } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true });

  const totalPages = Math.ceil((count ?? PAGE_SIZE) / PAGE_SIZE);
  const pages = Array.from({ length: totalPages }, (_, i) => i);

  const [restaurantPages, { data: userStatuses }] = await Promise.all([
    Promise.all(
      pages.map((i) =>
        supabase
          .from("restaurants")
          .select(RESTAURANT_SELECT)
          .order("name")
          .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1),
      ),
    ),
    user
      ? supabase
          .from("user_restaurants")
          .select("restaurant_id, status")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const restaurants = restaurantPages.flatMap((p) => (p.data ?? []) as MapRestaurant[]);

  const statuses = (userStatuses ?? [])
    .filter((r) => r.status != null)
    .map((r) => ({
      restaurantId: r.restaurant_id,
      status: r.status as RestaurantStatus,
    }));

  return (
    <MapView
      restaurants={restaurants}
      statuses={statuses}
    />
  );
}
