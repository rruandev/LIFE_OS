import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getServerSupabase } from "@/lib/supabase/server";

/** Destino dos links de e-mail (confirmação de conta e recuperação de senha). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  // Só caminhos internos, para o link não servir de redirecionamento para fora.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (isSupabaseConfigured && code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL("/login", url.origin));
}
