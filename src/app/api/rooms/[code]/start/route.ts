import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, getParticipantBySession, getRoomByCode } from "@/lib/api-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json().catch(() => null);
  const sessionId = String(body?.sessionId ?? "");
  if (!sessionId) return apiError("Sessão inválida");

  const room = await getRoomByCode(code);
  if (!room) return apiError("Sala não encontrada", 404);

  const participant = await getParticipantBySession(room.id, sessionId);
  if (!participant || !participant.is_host) return apiError("Só o host pode iniciar", 403);
  if (room.status !== "lobby") return apiError("A sala já foi iniciada", 409);

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + room.duration_seconds * 1000);

  const { data: updated, error } = await supabaseAdmin
    .from("rooms")
    .update({
      status: "running",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .eq("id", room.id)
    .eq("status", "lobby")
    .select("*")
    .single();
  if (error) return apiError(error.message, 500);

  return NextResponse.json({ room: updated });
}
