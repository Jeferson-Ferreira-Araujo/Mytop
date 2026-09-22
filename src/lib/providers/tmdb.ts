import "server-only";
import type { Category, SearchResultItem } from "@/lib/types";

const TMDB_TYPE: Record<string, "movie" | "tv" | "person"> = {
  movie: "movie",
  tv: "tv",
  movie_character: "person",
};

interface TmdbResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  profile_path?: string | null;
  known_for_department?: string;
  media_type?: string;
}

export async function searchTmdb(
  category: Category,
  query: string
): Promise<SearchResultItem[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY não configurada");

  const tmdbType = TMDB_TYPE[category];
  if (!tmdbType) throw new Error(`Categoria ${category} não suportada pelo TMDB`);

  const url = new URL(`https://api.themoviedb.org/3/search/${tmdbType}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("page", "1");

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  const data = (await res.json()) as { results: TmdbResult[] };

  return data.results.slice(0, 12).map((item) => {
    const name = item.title ?? item.name ?? "Sem nome";
    const imagePath = item.poster_path ?? item.profile_path ?? null;
    const image_url = imagePath ? `https://image.tmdb.org/t/p/w342${imagePath}` : null;

    let subtitle: string | null = null;
    if (tmdbType === "movie" && item.release_date) {
      subtitle = item.release_date.slice(0, 4);
    } else if (tmdbType === "tv" && item.first_air_date) {
      subtitle = item.first_air_date.slice(0, 4);
    } else if (tmdbType === "person") {
      subtitle = item.known_for_department ?? "Ator/Atriz";
    }

    return {
      provider: "tmdb",
      external_id: String(item.id),
      type: tmdbType,
      name,
      subtitle,
      image_url,
      external_url: `https://www.themoviedb.org/${tmdbType}/${item.id}`,
    };
  });
}
