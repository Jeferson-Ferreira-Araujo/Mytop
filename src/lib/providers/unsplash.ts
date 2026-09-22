import "server-only";
import type { SearchResultItem } from "@/lib/types";

interface UnsplashPhoto {
  id: string;
  alt_description: string | null;
  description: string | null;
  urls: { small: string; regular: string };
  links: { html: string };
  user: { name: string };
}

// Used for the free-text "general" category. The item's visible name is
// the participant's own search text (Unsplash has no reliable item
// names) — the photo just illustrates it.
export async function searchUnsplash(query: string): Promise<SearchResultItem[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) throw new Error("UNSPLASH_ACCESS_KEY não configurada");

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "12");
  url.searchParams.set("content_filter", "high");
  url.searchParams.set("orientation", "squarish");

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Unsplash error: ${res.status}`);
  const data = (await res.json()) as { results: UnsplashPhoto[] };

  return data.results.map((p) => ({
    provider: "unsplash" as const,
    external_id: p.id,
    type: "photo",
    name: query,
    subtitle: `Foto de ${p.user.name} no Unsplash`,
    image_url: p.urls.small,
    external_url: `${p.links.html}?utm_source=tops-app&utm_medium=referral`,
  }));
}
