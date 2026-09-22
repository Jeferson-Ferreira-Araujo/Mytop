"use client";

const PALETTE = ["#3b82f6", "#ec4899", "#22d3ee", "#22c58b", "#ef4565", "#84cc16", "#0ea5e9"];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({
  name,
  size = 40,
  ring = false,
}: {
  name: string;
  size?: number;
  ring?: boolean;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
  const bg = colorForName(name || "?");

  return (
    <div
      className={`flex items-center justify-center rounded-full font-display font-bold text-white shrink-0 ${
        ring ? "ring-2 ring-accent" : ""
      }`}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
