"use client";

import { useMemo } from "react";
import { Users, Navigation, Clock, X } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import { cn } from "@/lib/utils";

const PRICES = [1, 2, 3, 4];

export function FilterBar() {
  const restaurants = useMapStore((s) => s.restaurants);
  const cuisines = useMapStore((s) => s.cuisines);
  const prices = useMapStore((s) => s.prices);
  const toggleCuisine = useMapStore((s) => s.toggleCuisine);
  const togglePrice = useMapStore((s) => s.togglePrice);
  const clearFilters = useMapStore((s) => s.clearFilters);

  const cuisineOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of restaurants)
      for (const c of r.cuisine_type) counts.set(c, (counts.get(c) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c);
  }, [restaurants]);

  const hasFilters = cuisines.size > 0 || prices.size > 0;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3">
      {/* Disabled later-phase toggles + clear */}
      <div className="pointer-events-auto flex items-center gap-2 overflow-x-auto">
        {[
          { icon: Users, label: "Friends saved" },
          { icon: Navigation, label: "Near me" },
          { icon: Clock, label: "Open now" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            disabled
            title="Coming in a later phase"
            className="bg-card/80 text-muted-foreground inline-flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur"
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
          >
            <X className="size-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Price */}
      <div className="pointer-events-auto flex items-center gap-2">
        {PRICES.map((p) => (
          <button
            key={p}
            onClick={() => togglePrice(p)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors",
              prices.has(p)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/80 text-foreground hover:bg-card",
            )}
          >
            {"$".repeat(p)}
          </button>
        ))}
      </div>

      {/* Cuisine chips */}
      <div className="pointer-events-auto flex items-center gap-2 overflow-x-auto pb-1">
        {cuisineOptions.map((c) => (
          <button
            key={c}
            onClick={() => toggleCuisine(c)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors",
              cuisines.has(c)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/80 text-foreground hover:bg-card",
            )}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
