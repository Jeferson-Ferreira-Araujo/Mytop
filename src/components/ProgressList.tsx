"use client";

import { Avatar } from "@/components/Avatar";
import type { Participant } from "@/lib/types";

export function ProgressList({
  participants,
  topSize,
  currentSessionId,
}: {
  participants: Participant[];
  topSize: number;
  currentSessionId?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {participants.map((p) => {
        const done = p.finished_at !== null;
        return (
          <div
            key={p.id}
            className="glass-card rounded-xl px-3 py-2.5 flex items-center gap-3"
          >
            <Avatar name={p.name} size={32} />
            <span className="flex-1 text-sm font-medium truncate">
              {p.name}
              {p.session_id === currentSessionId ? " (você)" : ""}
            </span>
            <span
              className={`text-sm font-semibold tabular-nums ${done ? "text-success" : "text-text-muted"}`}
            >
              {p.progress_count}/{topSize} {done ? "✓" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
