import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client using the service role key. Every write, and every
// read of `rankings` / `ranking_items`, goes through this client inside
// API routes. Never import this file from a Client Component.
//
// Lazily constructed so that simply importing this module (which Next.js
// does while collecting route metadata at build time) doesn't throw when
// SUPABASE_SERVICE_ROLE_KEY isn't set yet in the build environment.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local"
      );
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
