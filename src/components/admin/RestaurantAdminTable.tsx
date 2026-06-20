"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { TagEditor } from "./TagEditor"
import { ManualAddSheet } from "./ManualAddSheet"
import { SUGGESTED_TAGS } from "@/lib/admin-tags"

type Restaurant = {
  id: string
  name: string
  district: string | null
  cuisine_type: string[]
  tags: string[]
  price_range: number | null
  google_rating: number | null
  google_rating_count: number | null
}

const DISTRICTS = [
  "BKK1", "BKK2", "BKK3", "Chamkarmon", "Daun Penh", "Riverside",
  "Toul Tom Poung", "Toul Kork", "Sen Sok", "Chroy Changvar",
  "Chbar Ampov", "Mean Chey", "Russei Keo", "Pochentong",
]

type Props = {
  initialRestaurants: Restaurant[]
  totalCount: number
  currentPage: number
  pageSize: number
  initialQ: string
  existingTags: string[]
}

export function RestaurantAdminTable({
  initialRestaurants,
  totalCount,
  currentPage,
  pageSize,
  initialQ,
  existingTags,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [q, setQ] = useState(initialQ)
  const [restaurants, setRestaurants] = useState(initialRestaurants)
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const totalPages = Math.ceil(totalCount / pageSize)
  const allSuggestions = Array.from(new Set([...SUGGESTED_TAGS, ...existingTags])).sort()

  function navigate(params: { q?: string; page?: number }) {
    const url = new URL(window.location.href)
    if (params.q !== undefined) url.searchParams.set("q", params.q)
    if (params.page !== undefined) url.searchParams.set("page", String(params.page))
    startTransition(() => router.push(url.pathname + url.search))
  }

  function handleSearch(value: string) {
    setQ(value)
    if (searchTimer) clearTimeout(searchTimer)
    setSearchTimer(setTimeout(() => navigate({ q: value, page: 1 }), 300))
  }

  const updateRestaurant = useCallback((id: string, field: "tags" | "cuisine_type", newValues: string[]) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: newValues } : r))
    )
  }, [])

  async function updateDistrict(id: string, district: string) {
    setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, district } : r)))
    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district }),
    })
    if (!res.ok) {
      const orig = initialRestaurants.find((r) => r.id === id)
      if (orig) setRestaurants((prev) => prev.map((r) => (r.id === id ? orig : r)))
    }
  }

  return (
    <div className="space-y-4">
      <ManualAddSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={() => router.refresh()}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Restaurants</h1>
          <p className="text-muted-foreground text-sm">{totalCount.toLocaleString()} total</p>
        </div>
        <div className="flex items-center gap-2">
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#D44C2A] px-3 py-2 text-sm font-medium text-white hover:bg-[#C04425] transition-colors"
        >
          <Plus className="size-4" /> Add restaurant
        </button>
        <div className="relative w-64">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search restaurants…"
            className="bg-card border-border w-full rounded-lg border py-2 pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border-border overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Name</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">District</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Cuisine</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {restaurants.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center text-sm">
                  No restaurants found.
                </td>
              </tr>
            )}
            {restaurants.map((r) => (
              <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-4 py-2.5">
                  <p className="font-medium">{r.name}</p>
                  {r.google_rating != null && (
                    <p className="text-muted-foreground text-xs">
                      {r.google_rating.toFixed(1)}★
                      {r.google_rating_count != null && ` (${r.google_rating_count.toLocaleString()})`}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={r.district ?? ""}
                    onChange={(e) => updateDistrict(r.id, e.target.value)}
                    className="bg-background border-border rounded border px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">—</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <TagEditor
                    restaurantId={r.id}
                    field="cuisine_type"
                    values={r.cuisine_type}
                    suggestions={allSuggestions}
                    onUpdate={(v) => updateRestaurant(r.id, "cuisine_type", v)}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <TagEditor
                    restaurantId={r.id}
                    field="tags"
                    values={r.tags}
                    suggestions={allSuggestions}
                    onUpdate={(v) => updateRestaurant(r.id, "tags", v)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate({ page: currentPage - 1 })}
            disabled={currentPage <= 1}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm disabled:opacity-40"
          >
            <ChevronLeft className="size-4" /> Prev
          </button>
          <span className="text-muted-foreground text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => navigate({ page: currentPage + 1 })}
            disabled={currentPage >= totalPages}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm disabled:opacity-40"
          >
            Next <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
