"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import { MAP_STYLES } from "./RestaurantMap";
import { cn } from "@/lib/utils";

export function MapStylePicker() {
  const mapStyleId = useMapStore((s) => s.mapStyleId);
  const setMapStyleId = useMapStore((s) => s.setMapStyleId);
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-24 left-3 z-10 flex flex-col items-start gap-2 md:bottom-9">
      {open && (
        <div className="flex flex-col gap-0.5 rounded-lg border bg-background/90 p-1 shadow-md backdrop-blur-sm">
          {MAP_STYLES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMapStyleId(mapStyleId === id ? null : id)}
              className={cn(
                "rounded px-3 py-1.5 text-left text-xs font-medium transition-colors",
                mapStyleId === id
                  ? "bg-[#D44C2A] text-white"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Map style"
        aria-expanded={open}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg border bg-background/90 shadow-md backdrop-blur-sm transition-colors",
          open ? "text-[#D44C2A]" : "text-foreground hover:bg-muted",
        )}
      >
        <Layers size={18} />
      </button>
    </div>
  );
}
