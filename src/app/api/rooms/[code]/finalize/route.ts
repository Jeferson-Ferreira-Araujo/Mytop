import { NextResponse } from "next/server";
import { apiError, finalizeRoomIfExpired, getRoomByCode } from "@/lib/api-helpers";

// Idempotent — any client can call this once its local countdown hits
// zero. The actual transition is guarded server-side by ends_at, so it
// is safe even if several participants call it at the same time.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await getRoomByCode(code);
  if (!room) return apiError("Sala não encontrada", 404);

  const finalRoom = await finalizeRoomIfExpired(room);
  return NextResponse.json({ room: finalRoom });
}
