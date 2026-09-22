"use client";

import type { Highlight, HighlightType } from "@/lib/highlights";

const STYLES: Record<HighlightType, { label: string; color: string }> = {
  unanime: { label: "Unânime", color: "#fbbf24" },
  maior_consenso: { label: "Maior consenso", color: "var(--success)" },
  maior_discordancia: { label: "Maior discordância", color: "var(--danger)" },
  escolha_unica: { label: "Escolha única", color: "var(--accent)" },
  dupla_parecida: { label: "Dupla mais parecida", color: "var(--primary)" },
};

export function HighlightCard({ highlight }: { highlight: Highlight }) {
  const style = STYLES[highlight.type];
  return (
    <div
      className="glass-card rounded-2xl p-4 flex flex-col gap-1.5 min-w-[220px]"
      style={{ borderColor: `color-mix(in srgb, ${style.color} 45%, var(--border))` }}
    >
      <span
        className="text-[11px] font-bold uppercase tracking-wide w-fit rounded-full px-2.5 py-1"
        style={{
          color: style.color,
          background: `color-mix(in srgb, ${style.color} 18%, transparent)`,
        }}
      >
        {highlight.emoji} {style.label}
      </span>
      <p className="font-display font-bold text-sm leading-snug">{highlight.headline}</p>
      <p className="text-xs text-text-muted">{highlight.detail}</p>
    </div>
  );
}
