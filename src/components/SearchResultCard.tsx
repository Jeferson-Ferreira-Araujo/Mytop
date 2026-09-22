"use client";

import { ItemImage } from "@/components/ItemImage";
import type { SearchResultItem } from "@/lib/types";

export function SearchResultCard({
  result,
  disabled,
  alreadyAdded,
  onAdd,
}: {
  result: SearchResultItem;
  disabled: boolean;
  alreadyAdded: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled || alreadyAdded}
      className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition border ${
        alreadyAdded
          ? "border-success/40 bg-success/10 cursor-default"
          : "border-transparent hover:border-primary/50 hover:bg-bg-elevated disabled:opacity-50 disabled:cursor-not-allowed"
      }`}
    >
      <ItemImage
        src={result.image_url}
        alt={result.name}
        className="w-12 h-12 rounded-lg object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{result.name}</p>
        {result.subtitle && <p className="text-xs text-text-muted truncate">{result.subtitle}</p>}
      </div>
      <span className="text-lg shrink-0">{alreadyAdded ? "✓" : "+"}</span>
    </button>
  );
}
