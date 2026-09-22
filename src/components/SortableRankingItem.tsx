"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItemImage } from "@/components/ItemImage";
import type { RankingItem } from "@/lib/types";

export function SortableRankingItem({
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
      className="glass-card rounded-xl p-2.5 flex items-center gap-3 touch-none"
    >
      <span className="font-display font-extrabold text-text-muted w-6 text-center shrink-0">
        {position}
      </span>
      <ItemImage
        src={item.image_url}
        alt={item.name}
        className="w-12 h-12 rounded-lg object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{item.name}</p>
        {item.subtitle && <p className="text-xs text-text-muted truncate">{item.subtitle}</p>}
      </div>
      {!disabled && (
        <>
          <button
            onClick={onRemove}
            className="text-text-muted hover:text-danger px-1.5 shrink-0"
            aria-label={`Remover ${item.name}`}
            title="Remover"
          >
            ✕
          </button>
          <button
            {...attributes}
            {...listeners}
            className="text-text-muted hover:text-text cursor-grab active:cursor-grabbing px-1.5 shrink-0 touch-none"
            aria-label="Arrastar para reordenar"
            title="Arrastar"
          >
            ⠿
          </button>
        </>
      )}
    </div>
  );
}
