"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItemImage } from "@/components/ItemImage";
import type { RankingItem } from "@/lib/types";

export function SortableRankingGridItem({
  item,
  position,
  disabled,
  onRemove,
}: {
  item: RankingItem;
  position: number;
  disabled: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
      className={`relative rounded-xl overflow-hidden touch-none ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      <span className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-xs font-display font-bold">
        {position}
      </span>
      {!disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Remover ${item.name}`}
          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-xs hover:bg-danger/80 transition"
        >
          ✕
        </button>
      )}
      <ItemImage src={item.image_url} alt={item.name} className="w-full aspect-[3/4] object-cover bg-bg-elevated" />
      <p className="text-[11px] font-medium leading-snug px-1.5 py-1.5 bg-bg-card truncate">{item.name}</p>
    </div>
  );
}
