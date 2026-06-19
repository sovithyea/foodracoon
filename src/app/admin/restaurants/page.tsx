import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RestaurantAdminTable } from "@/components/admin/RestaurantAdminTable"

const PAGE_SIZE = 40

export default async function AdminRestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) redirect("/")

  const { q = "", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const offset = (pageNum - 1) * PAGE_SIZE

  const query = supabase
    .from("restaurants")
    .select("id, name, district, cuisine_type, tags, price_range, google_rating, google_rating_count", { count: "exact" })
    .order("name")
    .range(offset, offset + PAGE_SIZE - 1)

  if (q) query.ilike("name", `%${q}%`)

  const { data: restaurants, count } = await query

  // Collect distinct tags from current page for autocomplete seed
  const existingTags = Array.from(
    new Set((restaurants ?? []).flatMap((r) => [...r.tags, ...r.cuisine_type]))
  ).sort()

  return (
    <RestaurantAdminTable
      initialRestaurants={restaurants ?? []}
      totalCount={count ?? 0}
      currentPage={pageNum}
      pageSize={PAGE_SIZE}
      initialQ={q}
      existingTags={existingTags}
    />
  )
}
