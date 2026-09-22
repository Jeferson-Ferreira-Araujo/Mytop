import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, finalizeRoomIfExpired, getRoomByCode } from "@/lib/api-helpers";
import { computeHighlights } from "@/lib/highlights";
import type { Participant, RankingItem, RevealParticipant } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await getRoomByCode(code);
  if (!room) return apiError("Sala não encontrada", 404);

  const finalRoom = await finalizeRoomIfExpired(room);
  if (finalRoom.status !== "finished") {
    return apiError("A rodada ainda não terminou", 409);
  }

  const { data: participants, error: pError } = await supabaseAdmin
    .from("participants")
    .select("*")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true });
  if (pError) return apiError(pError.message, 500);

  const { data: rankings, error: rError } = await supabaseAdmin
    .from("rankings")
    .select("id, participant_id")
    .eq("room_id", room.id);
  if (rError) return apiError(rError.message, 500);

  const rankingIds = (rankings ?? []).map((r) => r.id);
  const { data: items, error: iError } = await supabaseAdmin
    .from("ranking_items")
    .select("*")
    .in("ranking_id", rankingIds.length ? rankingIds : ["00000000-0000-0000-0000-000000000000"])
    .order("position", { ascending: true });
  if (iError) return apiError(iError.message, 500);

  const rankingByParticipant = new Map((rankings ?? []).map((r) => [r.participant_id, r.id]));
  const itemsByRanking = new Map<string, RankingItem[]>();
  for (const item of (items ?? []) as RankingItem[]) {
    const list = itemsByRanking.get(item.ranking_id) ?? [];
    list.push(item);
    itemsByRanking.set(item.ranking_id, list);
  }

  const revealParticipants: RevealParticipant[] = (participants as Participant[]).map((p) => {
    const rankingId = rankingByParticipant.get(p.id);
    return {
      participant: p,
      items: rankingId ? itemsByRanking.get(rankingId) ?? [] : [],
    };
  });

  const highlights = computeHighlights(revealParticipants, room.top_size);

  return NextResponse.json({ room: finalRoom, participants: revealParticipants, highlights });
}
