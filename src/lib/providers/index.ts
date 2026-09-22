import "server-only";
import type { Category, SearchResultItem } from "@/lib/types";
import { searchTmdb } from "./tmdb";
import { searchDeezer } from "./deezer";
import { searchIgdb } from "./igdb";
import { searchWikipediaFood } from "./wikipediaFood";
import { searchUnsplash } from "./unsplash";

export async function searchByCategory(
  category: Category,
  query: string
): Promise<SearchResultItem[]> {
  switch (category) {
    case "movie":
    case "tv":
    case "movie_character":
      return searchTmdb(category, query);
    case "music_track":
    case "music_artist":
    case "music_album":
      return searchDeezer(category, query);
    case "game":
      return searchIgdb(query);
    case "food":
      return searchWikipediaFood(query);
    case "general":
      return searchUnsplash(query);
    default:
      throw new Error(`Categoria desconhecida: ${category}`);
  }
}
