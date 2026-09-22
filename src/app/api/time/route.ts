import { NextResponse } from "next/server";

// Used by clients once on load to compute a clock offset against the
// server, so the countdown never trusts the local device clock alone.
export async function GET() {
  return NextResponse.json({ now: Date.now() });
}
