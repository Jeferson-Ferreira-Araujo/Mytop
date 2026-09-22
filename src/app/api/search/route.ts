import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-helpers";
import { isQuerySafe } from "@/lib/safety";
import { searchByCategory } from "@/lib/providers";
import type { Category } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as Category | null;
  const query = (searchParams.get("q") ?? "").trim();

  if (!category) return apiError("Categoria ausente");
  if (query.length < 2) return NextResponse.json({ results: [] });
  if (!isQuerySafe(query)) return apiError("Termo de busca não permitido", 400);

  try {
    const results = await searchByCategory(category, query);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("search error", err);
    return apiError("Erro ao buscar resultados. Verifique as chaves de API configuradas.", 502);
  }
}
