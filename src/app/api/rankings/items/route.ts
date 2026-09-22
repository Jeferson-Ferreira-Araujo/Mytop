import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, getParticipantBySession, getRoomByCode } from "@/lib/api-helpers";
import type { SearchResultItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return apiError("Corpo inválido");

  const roomCode = String(body.roomCode ?? "");
  const sessionId = String(body.sessionId ?? "");
  const item = body.item as SearchResultItem | undefined;
  if (!roomCode || !sessionId || !item) return apiError("Dados incompletos");

  const room = await getRoomByCode(roomCode);
  if (!room) return apiError("Sala não encontrada", 404);
  if (room.status !== "running") return apiError("A rodada não está em andamento", 409);
  if (room.ends_at && new Date(room.ends_at).getTime() <= Date.now()) {
    return apiError("O tempo acabou", 409);
  }

  const participant = await getParticipantBySession(room.id, sessionId);
  if (!participant) return apiError("Participante não encontrado", 404);
  if (participant.finished_at) return apiError("Seu Top já está finalizado", 409);

  const { data: ranking, error: rankingError } = await supabaseAdmin
    .from("rankings")
    .select("id")
    .eq("participant_id", participant.id)
    .single();
  if (rankingError || !ranking) return apiError("Ranking não encontrado", 500);

  const { count } = await supabaseAdmin
    .from("ranking_items")
    .select("id", { count: "exact", head: true })
    .eq("ranking_id", ranking.id);

  if ((count ?? 0) >= room.top_size) {
    return apiError(`Seu Top já tem ${room.top_size} itens`, 409);
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("ranking_items")
    .insert({
      ranking_id: ranking.id,
      position: (count ?? 0) + 1,
      provider: item.provider,
      external_id: item.external_id,
      type: item.type,
      name: item.name,
      subtitle: item.subtitle,
      image_url: item.image_url,
      external_url: item.external_url,
    })
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return apiError("Esse item já está no seu Top", 409);
    }
    return apiError(insertError.message, 500);
  }

  const newCount = (count ?? 0) + 1;
  await supabaseAdmin
    .from("participants")
    .update({ progress_count: newCount })
    .eq("id", participant.id);

  return NextResponse.json({ item: inserted, progressCount: newCount });
}
