import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/config";

const AUTH_PAGES = ["/login", "/cadastro", "/recuperar-senha"];
const OPEN_PREFIXES = [...AUTH_PAGES, "/auth"];

export async function proxy(request: NextRequest) {
  // Pré-visualização: sem banco não há sessão para checar.
  if (!isSupabaseConfigured) return NextResponse.next();

  // Link de e-mail que caiu fora de /auth/callback (acontece quando o endereço
  // de retorno não está liberado no Supabase): encaminha o código para lá.
  const code = request.nextUrl.searchParams.get("code");
  if (code && !request.nextUrl.pathname.startsWith("/auth/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getClaims confere a assinatura do token aqui mesmo, sem ir até o Supabase a
  // cada clique (só vai quando a sessão venceu e precisa ser renovada).
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const path = request.nextUrl.pathname;
  const isOpen = OPEN_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && !isOpen) {
    return redirectKeepingCookies(request, response, "/login");
  }
  if (user && AUTH_PAGES.includes(path)) {
    return redirectKeepingCookies(request, response, "/");
  }
  return response;
}

function redirectKeepingCookies(request: NextRequest, from: NextResponse, to: string) {
  const url = request.nextUrl.clone();
  url.pathname = to;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$).*)"],
};
