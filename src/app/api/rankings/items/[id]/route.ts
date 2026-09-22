import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, getParticipantBySession, getRoomByCode } from "@/lib/api-helpers";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const roomCode = String(body?.roomCode ?? "");
  const sessionId = String(body?.sessionId ?? "");
  if (!roomCode || !sessionId) return apiError("Dados incompletos");

  const room = await getRoomByCode(roomCode);
  if (!room) return apiError("Sala não encontrada", 404);
  if (room.status !== "running") return apiError("A rodada não está em andamento", 409);

  const participant = await getParticipantBySession(room.id, sessionId);
  if (!participant) return apiError("Participante não encontrado", 404);
  if (participant.finished_at) return apiError("Seu Top já está finalizado", 409);

  const { data: ranking } = await supabaseAdmin
    .from("rankings")
    .select("id")
    .eq("participant_id", participant.id)
    .single();
  if (!ranking) return apiError("Ranking não encontrado", 500);

  const { data: item } = await supabaseAdmin
    .from("ranking_items")
    .select("id, ranking_id")
    .eq("id", id)
    .eq("ranking_id", ranking.id)
    .maybeSingle();
  if (!item) return apiError("Item não encontrado", 404);

  await supabaseAdmin.from("ranking_items").delete().eq("id", id);

  const { data: remaining } = await supabaseAdmin
    .from("ranking_items")
    .select("id")
    .eq("ranking_id", ranking.id)
    .order("position", { ascending: true });

  for (let i = 0; i < (remaining?.length ?? 0); i++) {
    await supabaseAdmin
      .from("ranking_items")
      .update({ position: i + 1 })
      .eq("id", remaining![i].id);
  }

  const newCount = remaining?.length ?? 0;
  await supabaseAdmin
    .from("participants")
    .update({ progress_count: newCount })
    .eq("id", participant.id);

  return NextResponse.json({ progressCount: newCount });
}
