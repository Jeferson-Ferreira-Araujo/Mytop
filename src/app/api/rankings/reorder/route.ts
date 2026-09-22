import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, getParticipantBySession, getRoomByCode } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const roomCode = String(body?.roomCode ?? "");
  const sessionId = String(body?.sessionId ?? "");
  const orderedItemIds = body?.orderedItemIds as string[] | undefined;
  if (!roomCode || !sessionId || !Array.isArray(orderedItemIds)) {
    return apiError("Dados incompletos");
  }

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

  const { data: existingItems } = await supabaseAdmin
    .from("ranking_items")
    .select("id")
    .eq("ranking_id", ranking.id);

  const existingIds = new Set((existingItems ?? []).map((i) => i.id));
  if (
    orderedItemIds.length !== existingIds.size ||
    !orderedItemIds.every((itemId) => existingIds.has(itemId))
  ) {
    return apiError("Lista de itens inconsistente", 409);
  }

  // Two-phase update to dodge the (ranking_id, position) unique constraint
  // while items are mid-shuffle: push everything into a safe high range
  // first, then set final positions.
  await Promise.all(
    orderedItemIds.map((itemId, index) =>
      supabaseAdmin
        .from("ranking_items")
        .update({ position: 1000 + index })
        .eq("id", itemId)
    )
  );
  await Promise.all(
    orderedItemIds.map((itemId, index) =>
      supabaseAdmin
        .from("ranking_items")
        .update({ position: index + 1 })
        .eq("id", itemId)
    )
  );

  return NextResponse.json({ ok: true });
}
