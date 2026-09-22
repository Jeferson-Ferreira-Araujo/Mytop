"use client";

export function Timer({
  remainingMs,
  totalMs,
}: {
  remainingMs: number;
  totalMs: number;
}) {
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const fraction = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;

  const urgent = remainingSeconds <= 10;
  const warning = !urgent && fraction < 0.25;

  const color = urgent ? "var(--danger)" : warning ? "#fbbf24" : "var(--accent)";

  return (
    <div className="glass-card rounded-2xl px-5 py-3 flex items-center gap-4 min-w-[180px]">
      <span
        className={`font-display text-2xl font-extrabold tabular-nums ${urgent ? "animate-pulse" : ""}`}
        style={{ color }}
      >
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
      <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-linear"
          style={{ width: `${fraction * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}
