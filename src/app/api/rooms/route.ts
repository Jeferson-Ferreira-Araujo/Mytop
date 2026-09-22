import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateRoomCode, generateSessionId } from "@/lib/roomCode";
import { apiError } from "@/lib/api-helpers";
import type { Category } from "@/lib/types";

const VALID_CATEGORIES: Category[] = [
  "movie",
  "tv",
  "movie_character",
  "music_track",
  "music_artist",
  "music_album",
  "game",
  "food",
  "general",
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return apiError("Corpo inválido");

  const theme = String(body.theme ?? "").trim().slice(0, 120);
  const category = body.category as Category;
  const topSize = Number(body.topSize);
  const durationSeconds = Number(body.durationSeconds);
  const hostName = String(body.hostName ?? "").trim().slice(0, 40);

  if (!theme) return apiError("Informe um tema para a sala");
  if (!VALID_CATEGORIES.includes(category)) return apiError("Categoria inválida");
  if (!Number.isInteger(topSize) || topSize < 3 || topSize > 20)
    return apiError("Quantidade de posições deve ser entre 3 e 20");
  if (!Number.isInteger(durationSeconds) || durationSeconds < 30 || durationSeconds > 3600)
    return apiError("Tempo inválido");
  if (!hostName) return apiError("Informe seu nome");

  let code = generateRoomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabaseAdmin
      .from("rooms")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
    code = generateRoomCode();
  }

  const { data: room, error: roomError } = await supabaseAdmin
    .from("rooms")
    .insert({
      code,
      host_session_id: "",
      theme,
      category,
      top_size: topSize,
      duration_seconds: durationSeconds,
      status: "lobby",
    })
    .select("*")
    .single();
  if (roomError) return apiError(roomError.message, 500);

  const sessionId = generateSessionId();
  const { data: participant, error: participantError } = await supabaseAdmin
    .from("participants")
    .insert({
      room_id: room.id,
      session_id: sessionId,
      name: hostName,
      is_host: true,
    })
    .select("*")
    .single();
  if (participantError) return apiError(participantError.message, 500);

  await supabaseAdmin.from("rankings").insert({
    room_id: room.id,
    participant_id: participant.id,
  });

  await supabaseAdmin.from("rooms").update({ host_session_id: sessionId }).eq("id", room.id);

  return NextResponse.json({
    room: { ...room, host_session_id: sessionId },
    session: {
      sessionId,
      participantId: participant.id,
      name: participant.name,
      isHost: true,
    },
  });
}
