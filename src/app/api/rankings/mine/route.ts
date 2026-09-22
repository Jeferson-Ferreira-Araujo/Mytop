import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, getParticipantBySession, getRoomByCode } from "@/lib/api-helpers";

// Lets a participant reload their own (still-secret) list, e.g. after a
// page refresh mid-round. Ownership is proven by knowing the session id
// stored in their browser's localStorage — nobody else's items are ever
// returned from here.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomCode = searchParams.get("roomCode") ?? "";
  const sessionId = searchParams.get("sessionId") ?? "";
  if (!roomCode || !sessionId) return apiError("Dados incompletos");

  const room = await getRoomByCode(roomCode);
  if (!room) return apiError("Sala não encontrada", 404);

  const participant = await getParticipantBySession(room.id, sessionId);
  if (!participant) return apiError("Participante não encontrado", 404);

  const { data: ranking } = await supabaseAdmin
    .from("rankings")
    .select("id")
    .eq("participant_id", participant.id)
    .single();
  if (!ranking) return NextResponse.json({ items: [] });

  const { data: items, error } = await supabaseAdmin
    .from("ranking_items")
    .select("*")
    .eq("ranking_id", ranking.id)
    .order("position", { ascending: true });
  if (error) return apiError(error.message, 500);

  return NextResponse.json({ items, participant });
}
