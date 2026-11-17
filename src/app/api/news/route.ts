import { connection, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { dedupe, FeedError, fetchFeed } from "@/lib/news/feed";
import { getServerSupabase } from "@/lib/supabase/server";
import type { NewsItem } from "@/modules/intelligence/store";

const MAX_ITEMS = 120;
const MAX_SOURCES = 40;
const HEADERS = { "cache-control": "private, max-age=300" };

type SourceRow = { name: string; url: string; topic: string };

export async function GET(request: NextRequest) {
  // Cache Components ligado: `connection()` marca a rota como dinâmica (dados do momento do pedido).
  await connection();

  if (!isSupabaseConfigured) {
    return Response.json({ items: [], errors: [], preview: true }, { headers: HEADERS });
  }

  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return Response.json({ error: "Entre na sua conta para ver as notícias." }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const { data: rows, error } = await supabase
    .from("news_sources")
    .select("name, url, topic")
    .eq("enabled", true)
    .order("created_at", { ascending: true })
    .limit(MAX_SOURCES);
  if (error) {
    return Response.json({ error: "Não foi possível ler suas fontes de notícias." }, { status: 500, headers: { "cache-control": "no-store" } });
  }

  const sources = (rows ?? []) as SourceRow[];
  // "Atualizar" pede leitura nova, mas nunca mais de uma por minuto para cada feed.
  const maxAge = request.nextUrl.searchParams.get("refresh") === "1" ? 60_000 : undefined;
  const results = await Promise.allSettled(sources.map((s) => fetchFeed(s, maxAge)));

  const items: NewsItem[] = [];
  const errors: { source: string; message: string }[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      items.push(...r.value);
    } else {
      const reason = r.reason instanceof FeedError ? r.reason.message : "o endereço não respondeu.";
      errors.push({ source: sources[i].name, message: `Não foi possível ler o feed de ${sources[i].name}: ${reason}` });
    }
  });

  return Response.json({ items: dedupe(items).slice(0, MAX_ITEMS), errors }, { headers: HEADERS });
}
