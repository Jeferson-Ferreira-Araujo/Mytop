import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, getRoomByCode } from "@/lib/api-helpers";
import { generateSessionId } from "@/lib/roomCode";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim().slice(0, 40);
  if (!name) return apiError("Informe seu nome");

  const room = await getRoomByCode(code);
  if (!room) return apiError("Sala não encontrada", 404);
  if (room.status !== "lobby") return apiError("Esta sala já começou a rodada", 409);

  const sessionId = generateSessionId();
  const { data: participant, error } = await supabaseAdmin
    .from("participants")
    .insert({
      room_id: room.id,
      session_id: sessionId,
      name,
      is_host: false,
    })
    .select("*")
    .single();
  if (error) return apiError(error.message, 500);

  await supabaseAdmin.from("rankings").insert({
    room_id: room.id,
    participant_id: participant.id,
  });

  return NextResponse.json({
    room,
    session: {
      sessionId,
      participantId: participant.id,
      name: participant.name,
      isHost: false,
    },
  });
}
