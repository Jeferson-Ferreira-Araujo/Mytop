"use client";

import { createClient } from "@supabase/supabase-js";

// Browser client — only ever used for Realtime subscriptions on the
// `rooms` and `participants` tables (see supabase/schema.sql for the
// public read policies). No writes happen from the client.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);
