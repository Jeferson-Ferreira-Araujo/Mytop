import "server-only";
import type { Category, SearchResultItem } from "@/lib/types";
import { searchTmdb } from "./tmdb";
import { searchDeezer } from "./deezer";
import { searchIgdb } from "./igdb";
import { searchTheMealDb } from "./themealdb";
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
      return searchFood(query);
    case "general":
      return searchUnsplash(query);
    default:
      throw new Error(`Categoria desconhecida: ${category}`);
  }
}

// TheMealDB is a mostly international/English recipe database with very
// thin coverage of Brazilian dishes (no "coxinha", "pão de queijo", ...).
// Portuguese Wikipedia fills that gap with a photo + short description for
// most well-known Brazilian foods, so we merge both — Wikipedia first,
// since the audience here is PT-BR.
async function searchFood(query: string): Promise<SearchResultItem[]> {
  const [wiki, meals] = await Promise.allSettled([
    searchWikipediaFood(query),
    searchTheMealDb(query),
  ]);
  const wikiResults = wiki.status === "fulfilled" ? wiki.value : [];
  const mealResults = meals.status === "fulfilled" ? meals.value : [];
  return [...wikiResults, ...mealResults].slice(0, 14);
}
