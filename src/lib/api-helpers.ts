import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Participant, Room } from "@/lib/types";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const { data, error } = await supabaseAdmin
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data as Room | null;
}

export async function getParticipantBySession(
  roomId: string,
  sessionId: string
): Promise<Participant | null> {
  const { data, error } = await supabaseAdmin
    .from("participants")
    .select("*")
    .eq("room_id", roomId)
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return data as Participant | null;
}

/** Flips a room from running -> finished once its timer has expired.
 *  Safe to call repeatedly / concurrently: the WHERE clause makes the
 *  transition atomic and a no-op once it has already happened. */
export async function finalizeRoomIfExpired(room: Room): Promise<Room> {
  if (room.status !== "running" || !room.ends_at) return room;
  if (new Date(room.ends_at).getTime() > Date.now()) return room;

  const { data, error } = await supabaseAdmin
    .from("rooms")
    .update({ status: "finished" })
    .eq("id", room.id)
    .eq("status", "running")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data as Room | null) ?? { ...room, status: "finished" };
}
