import "server-only";
import type { Category, SearchResultItem } from "@/lib/types";

const DEEZER_TYPE: Record<string, "track" | "artist" | "album"> = {
  music_track: "track",
  music_artist: "artist",
  music_album: "album",
};

interface DeezerArtistRef {
  name: string;
}

interface DeezerTrack {
  id: number;
  title: string;
  artist: DeezerArtistRef;
  album: { cover_medium: string | null };
  link: string;
}

interface DeezerAlbum {
  id: number;
  title: string;
  artist: DeezerArtistRef;
  cover_medium: string | null;
  link: string;
}

interface DeezerArtist {
  id: number;
  name: string;
  picture_medium: string | null;
  link: string;
  nb_fan: number;
}

// Deezer's search API is public and needs no API key/auth at all — a
// simple, free alternative to Spotify (whose developer mode now requires
// a Premium account) for tracks/artists/albums.
export async function searchDeezer(
  category: Category,
  query: string
): Promise<SearchResultItem[]> {
  const type = DEEZER_TYPE[category];
  if (!type) throw new Error(`Categoria ${category} não suportada pelo Deezer`);

  const url = new URL(`https://api.deezer.com/search/${type}`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "12");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Deezer error: ${res.status}`);
  const data = (await res.json()) as { data: unknown[] };

  if (type === "track") {
    return (data.data as DeezerTrack[]).map((t) => ({
      provider: "deezer" as const,
      external_id: String(t.id),
      type: "track",
      name: t.title,
      subtitle: t.artist.name,
      image_url: t.album.cover_medium,
      external_url: t.link,
    }));
  }

  if (type === "album") {
    return (data.data as DeezerAlbum[]).map((a) => ({
      provider: "deezer" as const,
      external_id: String(a.id),
      type: "album",
      name: a.title,
      subtitle: a.artist.name,
      image_url: a.cover_medium,
      external_url: a.link,
    }));
  }

  return (data.data as DeezerArtist[]).map((a) => ({
    provider: "deezer" as const,
    external_id: String(a.id),
    type: "artist",
    name: a.name,
    subtitle: a.nb_fan ? `${a.nb_fan.toLocaleString("pt-BR")} fãs` : "Artista",
    image_url: a.picture_medium,
    external_url: a.link,
  }));
}
