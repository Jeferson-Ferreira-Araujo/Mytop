import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, finalizeRoomIfExpired, getRoomByCode } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await getRoomByCode(code);
  if (!room) return apiError("Sala não encontrada", 404);

  const finalRoom = await finalizeRoomIfExpired(room);

  const { data: participants, error } = await supabaseAdmin
    .from("participants")
    .select("*")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true });
  if (error) return apiError(error.message, 500);

  return NextResponse.json({ room: finalRoom, participants });
}
