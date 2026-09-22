import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, getParticipantBySession, getRoomByCode } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const roomCode = String(body?.roomCode ?? "");
  const sessionId = String(body?.sessionId ?? "");
  if (!roomCode || !sessionId) return apiError("Dados incompletos");

  const room = await getRoomByCode(roomCode);
  if (!room) return apiError("Sala não encontrada", 404);
  if (room.status !== "running") return apiError("A rodada não está em andamento", 409);

  const participant = await getParticipantBySession(room.id, sessionId);
  if (!participant) return apiError("Participante não encontrado", 404);

  if (!participant.finished_at) {
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("participants")
      .update({ finished_at: now })
      .eq("id", participant.id);
    await supabaseAdmin
      .from("rankings")
      .update({ is_final: true, finished_at: now })
      .eq("participant_id", participant.id);
  }

  const { data: allParticipants } = await supabaseAdmin
    .from("participants")
    .select("finished_at")
    .eq("room_id", room.id);

  const allFinished = (allParticipants ?? []).every((p) => p.finished_at !== null);

  if (allFinished) {
    await supabaseAdmin
      .from("rooms")
      .update({ status: "finished" })
      .eq("id", room.id)
      .eq("status", "running");
  }

  return NextResponse.json({ ok: true, allFinished });
}
