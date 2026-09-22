"use client";

import { useEffect, useState } from "react";

/** Offset (ms) to add to Date.now() to approximate the server's clock. */
export function useServerClockOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const requestStart = Date.now();
      try {
        const res = await fetch("/api/time", { cache: "no-store" });
        const { now } = (await res.json()) as { now: number };
        const requestEnd = Date.now();
        // Assume the request took roughly the same time each way.
        const latency = (requestEnd - requestStart) / 2;
        const estimatedServerNow = now + latency;
        if (!cancelled) setOffset(estimatedServerNow - requestEnd);
      } catch {
        // Keep offset at 0 (fall back to local clock) if the sync fails.
      }
    }

    sync();
    const interval = setInterval(sync, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return offset;
}

export function serverNow(offset: number) {
  return Date.now() + offset;
}
