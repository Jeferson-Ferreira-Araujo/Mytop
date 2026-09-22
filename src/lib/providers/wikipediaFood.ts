import "server-only";
import type { SearchResultItem } from "@/lib/types";

interface WikiPage {
  pageid: number;
  title: string;
  index?: number;
  description?: string;
  thumbnail?: { source: string };
}

// TheMealDB barely covers Brazilian/regional dishes (no "coxinha", "pão de
// queijo", etc). Portuguese Wikipedia has solid coverage of these with a
// photo + short description, no API key needed, so we use it as a
// complementary source for the "food" category — especially useful for a
// PT-BR audience.
export async function searchWikipediaFood(query: string): Promise<SearchResultItem[]> {
  const url = new URL("https://pt.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrlimit", "8");
  url.searchParams.set("gsrnamespace", "0");
  url.searchParams.set("prop", "pageimages|description");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "300");
  url.searchParams.set("format", "json");

  const res = await fetch(url, {
    headers: { "User-Agent": "SameTop/1.0 (https://sametop.vercel.app)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Wikipedia error: ${res.status}`);
  const data = (await res.json()) as { query?: { pages?: Record<string, WikiPage> } };
  const pages = Object.values(data.query?.pages ?? {});

  return pages
    .filter((p) => p.thumbnail) // drop disambiguation/text-only stubs — keep it visual
    .sort((a, b) => (a.index ?? 999) - (b.index ?? 999))
    .slice(0, 6)
    .map((p) => ({
      provider: "wikipedia" as const,
      external_id: String(p.pageid),
      type: "food",
      name: p.title,
      subtitle: p.description ? capitalize(p.description) : null,
      image_url: p.thumbnail!.source,
      external_url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`,
    }));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
