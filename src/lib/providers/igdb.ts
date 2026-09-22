import "server-only";
import type { SearchResultItem } from "@/lib/types";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getTwitchToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.value;
  }

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("IGDB_CLIENT_ID/IGDB_CLIENT_SECRET não configurados");
  }

  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  const res = await fetch(url, { method: "POST", cache: "no-store" });
  if (!res.ok) throw new Error(`IGDB/Twitch auth error: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

interface IgdbGame {
  id: number;
  name: string;
  url?: string;
  first_release_date?: number;
  cover?: { image_id: string };
}

export async function searchIgdb(query: string): Promise<SearchResultItem[]> {
  const clientId = process.env.IGDB_CLIENT_ID;
  const token = await getTwitchToken();

  const body = `search "${query.replace(/"/g, '\\"')}"; fields name,url,first_release_date,cover.image_id; limit 12;`;

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": clientId!,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`IGDB search error: ${res.status}`);
  const games = (await res.json()) as IgdbGame[];

  return games.map((g) => ({
    provider: "igdb" as const,
    external_id: String(g.id),
    type: "game",
    name: g.name,
    subtitle: g.first_release_date
      ? String(new Date(g.first_release_date * 1000).getUTCFullYear())
      : null,
    image_url: g.cover
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
      : null,
    external_url: g.url ?? null,
  }));
}
