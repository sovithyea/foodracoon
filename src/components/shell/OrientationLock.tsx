"use client";

import { useEffect } from "react";

export function OrientationLock() {
  useEffect(() => {
    try {
      (screen.orientation as unknown as { lock: (o: string) => Promise<void> })
        .lock("portrait")
        .catch(() => {});
    } catch {
      // API not supported (iOS Safari)
    }
  }, []);

  return null;
}
