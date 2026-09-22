"use client";

import { useState } from "react";

export function ItemImage({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div
        className={`flex items-center justify-center bg-bg-elevated text-text-muted font-display font-bold ${className}`}
        aria-label={alt}
      >
        {alt.slice(0, 1).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- sources are arbitrary external domains (TMDB/Spotify/IGDB/etc.), next/image would need every host whitelisted
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
