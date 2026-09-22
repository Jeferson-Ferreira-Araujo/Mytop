export type Category =
  | "movie"
  | "tv"
  | "movie_character"
  | "music_track"
  | "music_artist"
  | "music_album"
  | "game"
  | "food"
  | "general";

export type Provider = "tmdb" | "deezer" | "igdb" | "wikipedia" | "unsplash";

export type RoomStatus = "lobby" | "running" | "reveal" | "finished";

export interface Room {
  id: string;
  code: string;
  host_session_id: string;
  theme: string;
  category: Category;
  top_size: number;
  duration_seconds: number;
  status: RoomStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface Participant {
  id: string;
  room_id: string;
  session_id: string;
  name: string;
  is_host: boolean;
  progress_count: number;
  finished_at: string | null;
  created_at: string;
}

export interface RankingItem {
  id: string;
  ranking_id: string;
  position: number;
  provider: Provider;
  external_id: string;
  type: string;
  name: string;
  subtitle: string | null;
  image_url: string | null;
  external_url: string | null;
}

/** Normalized shape returned by every search provider. */
export interface SearchResultItem {
  provider: Provider;
  external_id: string;
  type: string;
  name: string;
  subtitle: string | null;
  image_url: string | null;
  external_url: string | null;
}

export interface RoomWithCounts extends Room {
  participants: Participant[];
}

export interface RevealParticipant {
  participant: Participant;
  items: RankingItem[];
}

export interface RevealData {
  room: Room;
  participants: RevealParticipant[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  movie: "Filmes",
  tv: "Séries",
  movie_character: "Personagens",
  music_track: "Músicas",
  music_artist: "Artistas/Bandas",
  music_album: "Álbuns",
  game: "Jogos",
  food: "Comidas",
  general: "Tema livre",
};

export const CATEGORY_PROVIDER: Record<Category, Provider> = {
  movie: "tmdb",
  tv: "tmdb",
  movie_character: "tmdb",
  music_track: "deezer",
  music_artist: "deezer",
  music_album: "deezer",
  game: "igdb",
  food: "wikipedia",
  general: "unsplash",
};
