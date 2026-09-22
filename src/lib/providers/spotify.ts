import "server-only";
import type { Category, SearchResultItem } from "@/lib/types";

const SPOTIFY_TYPE: Record<string, "track" | "artist" | "album"> = {
  music_track: "track",
  music_artist: "artist",
  music_album: "album",
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET não configurados");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Spotify auth error: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

interface SpotifyImage {
  url: string;
}

interface SpotifyArtistRef {
  name: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtistRef[];
  album: { images: SpotifyImage[] };
  external_urls: { spotify: string };
}

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: SpotifyArtistRef[];
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

export async function searchSpotify(
  category: Category,
  query: string
): Promise<SearchResultItem[]> {
  const type = SPOTIFY_TYPE[category];
  if (!type) throw new Error(`Categoria ${category} não suportada pelo Spotify`);

  const token = await getAppToken();
  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", type);
  url.searchParams.set("limit", "12");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify search error: ${res.status}`);
  const data = await res.json();

  if (type === "track") {
    const tracks: SpotifyTrack[] = data.tracks?.items ?? [];
    return tracks.map((t) => ({
      provider: "spotify" as const,
      external_id: t.id,
      type: "track",
      name: t.name,
      subtitle: t.artists.map((a) => a.name).join(", "),
      image_url: t.album.images[0]?.url ?? null,
      external_url: t.external_urls.spotify,
    }));
  }

  if (type === "album") {
    const albums: SpotifyAlbum[] = data.albums?.items ?? [];
    return albums.map((a) => ({
      provider: "spotify" as const,
      external_id: a.id,
      type: "album",
      name: a.name,
      subtitle: a.artists.map((ar) => ar.name).join(", "),
      image_url: a.images[0]?.url ?? null,
      external_url: a.external_urls.spotify,
    }));
  }

  const artists: SpotifyArtist[] = data.artists?.items ?? [];
  return artists.map((a) => ({
    provider: "spotify" as const,
    external_id: a.id,
    type: "artist",
    name: a.name,
    subtitle: a.genres[0] ? capitalize(a.genres[0]) : "Artista",
    image_url: a.images[0]?.url ?? null,
    external_url: a.external_urls.spotify,
  }));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
