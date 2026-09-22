// Lightweight query moderation. This is intentionally simple for the MVP:
// it blocks obviously sexual/adult search terms before they ever reach an
// external API. Providers additionally set their own SafeSearch / adult
// filters where available (TMDB include_adult=false, Unsplash
// content_filter=high). Extend BLOCKED_TERMS or swap this module out for a
// real moderation API later — callers only depend on `isQuerySafe`.

const BLOCKED_TERMS = [
  "porn",
  "pornô",
  "porno",
  "pornografia",
  "xvideos",
  "xnxx",
  "nude",
  "nudes",
  "nua",
  "nu ",
  "sexo",
  "sex ",
  "sexual",
  "erotic",
  "erótico",
  "erotica",
  "hentai",
  "fetish",
  "fetiche",
  "onlyfans",
  "incest",
  "incesto",
  "rape",
  "estupro",
  "child abuse",
  "cp ",
  "lolicon",
  "bestiality",
  "zoofilia",
];

export function isQuerySafe(query: string): boolean {
  const normalized = ` ${query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")} `;
  return !BLOCKED_TERMS.some((term) => normalized.includes(term));
}
