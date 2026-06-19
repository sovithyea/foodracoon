export function formatGoogleRating(
  rating: number | null,
  count: number | null,
): string | null {
  if (!rating) return null
  if (count !== null && count < 5) return null
  const countStr = count ? ` (${count.toLocaleString()})` : ""
  return `${rating.toFixed(1)}★${countStr}`
}

export function formatCommunityRating(
  avgRating: number | null,
  count: number,
): string | null {
  if (!avgRating || count < 5) return null
  return `${avgRating.toFixed(1)} · ${count} ${count === 1 ? "review" : "reviews"}`
}
