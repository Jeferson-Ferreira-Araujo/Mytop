import "server-only";
import type { SearchResultItem } from "@/lib/types";

interface Meal {
  idMeal: string;
  strMeal: string;
  strCategory?: string;
  strArea?: string;
  strMealThumb?: string;
}

export async function searchTheMealDb(query: string): Promise<SearchResultItem[]> {
  const apiKey = process.env.THEMEALDB_API_KEY || "1";
  const url = new URL(`https://www.themealdb.com/api/json/v1/${apiKey}/search.php`);
  url.searchParams.set("s", query);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`TheMealDB error: ${res.status}`);
  const data = (await res.json()) as { meals: Meal[] | null };
  if (!data.meals) return [];

  return data.meals.slice(0, 12).map((m) => ({
    provider: "themealdb" as const,
    external_id: m.idMeal,
    type: "meal",
    name: m.strMeal,
    subtitle: [m.strArea, m.strCategory].filter(Boolean).join(" · ") || null,
    image_url: m.strMealThumb ?? null,
    external_url: `https://www.themealdb.com/meal/${m.idMeal}`,
  }));
}
