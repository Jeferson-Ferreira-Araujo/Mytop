import "server-only";
import type { SearchResultItem } from "@/lib/types";

interface WikiPage {
  title: string;
  description?: string;
  thumbnail?: { source: string };
}

const USER_AGENT = "SameTop/1.0 (https://sametop.vercel.app)";

// Portuguese Wikipedia as the "food" category's search source — good
// coverage of Brazilian dishes with a photo + short description, in the
// audience's own language. Two calls:
// 1) opensearch — title-prefix search, much more precise than full-text
//    search (which pulled in unrelated pages like "São Paulo" or random
//    song titles just for sharing a word with the query).
// 2) query — fetch the thumbnail/description for exactly those titles.
export async function searchWikipediaFood(query: string): Promise<SearchResultItem[]> {
  const openUrl = new URL("https://pt.wikipedia.org/w/api.php");
  openUrl.searchParams.set("action", "opensearch");
  openUrl.searchParams.set("search", query);
  openUrl.searchParams.set("limit", "8");
  openUrl.searchParams.set("namespace", "0");
  openUrl.searchParams.set("format", "json");

  const openRes = await fetch(openUrl, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!openRes.ok) throw new Error(`Wikipedia error: ${openRes.status}`);
  const [, rawTitles] = (await openRes.json()) as [string, string[], string[], string[]];

  // opensearch falls back to fuzzy/"did you mean" suggestions once true
  // prefix matches run out (e.g. "coxinha" → "Copenhaga", "Costinha
  // (humorista)"). Keep only titles that actually contain the query, so
  // that fallback noise doesn't fill the results once the relevant ones
  // get filtered out below for lacking a photo.
  const normalizedQuery = normalize(query);
  const titles = rawTitles.filter((t) => normalize(t).includes(normalizedQuery));
  if (titles.length === 0) return [];

  const detailUrl = new URL("https://pt.wikipedia.org/w/api.php");
  detailUrl.searchParams.set("action", "query");
  detailUrl.searchParams.set("titles", titles.join("|"));
  detailUrl.searchParams.set("prop", "pageimages|description");
  detailUrl.searchParams.set("piprop", "thumbnail");
  detailUrl.searchParams.set("pithumbsize", "300");
  detailUrl.searchParams.set("format", "json");

  const detailRes = await fetch(detailUrl, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!detailRes.ok) throw new Error(`Wikipedia error: ${detailRes.status}`);
  const detailData = (await detailRes.json()) as {
    query?: { pages?: Record<string, WikiPage & { pageid: number }> };
  };
  const pages = Object.values(detailData.query?.pages ?? {});
  const byTitle = new Map(pages.map((p) => [p.title, p]));

  // Re-order to match opensearch's relevance ranking (the query endpoint
  // doesn't preserve it); keep only entries with a photo, and drop ones
  // that are clearly places (towns/cities/regions often share a name with
  // a dish — e.g. "Açailândia" or "Acaiaca" turning up for "açaí").
  return titles
    .map((title) => byTitle.get(title))
    .filter((p): p is WikiPage & { pageid: number } => !!p?.thumbnail)
    .filter((p) => !isPlace(p.description) && !isPlace(placeHintFromTitle(p.title)))
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

// Anchored to the start: Wikipedia's short descriptions for actual places
// *begin* with the classification (e.g. "Município brasileiro do estado
// de..."). Matching anywhere in the string would also catch dishes whose
// description just mentions a state in passing (e.g. "Açaí na tigela" →
// "...originário do estado do Pará").
const PLACE_PATTERN =
  /^(municipio|cidade|capital d|distrito|provincia|regiao|estado d[eo]|unidade federativa|bairro|freguesia|aldeia|vila d|comuna|condado|ilha d|planeta|estrela|constelacao)/;

function placeHintFromTitle(title: string): string | undefined {
  // Wikipedia disambiguates places in the title itself when there's no
  // short description, e.g. "Acaia (província romana)".
  const match = title.match(/\(([^)]+)\)\s*$/);
  return match?.[1];
}

function isPlace(description: string | undefined) {
  if (!description) return false;
  return PLACE_PATTERN.test(normalize(description));
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
