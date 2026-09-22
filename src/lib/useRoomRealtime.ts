"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Room } from "@/lib/types";

interface Handlers {
  onRoomUpdate?: (room: Room) => void;
  onParticipantChange?: () => void;
}

/** Subscribes to Realtime changes for a room + its participants. */
export function useRoomRealtime(roomId: string | null, handlers: Handlers) {
  const { onRoomUpdate, onParticipantChange } = handlers;

  useEffect(() => {
    if (!roomId) return;

    const channel = supabaseBrowser
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => onRoomUpdate?.(payload.new as Room)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants", filter: `room_id=eq.${roomId}` },
        () => onParticipantChange?.()
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);
}
