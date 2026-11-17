import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/config";

const AUTH_PAGES = ["/login", "/cadastro", "/recuperar-senha"];
const OPEN_PREFIXES = [...AUTH_PAGES, "/auth"];

export async function proxy(request: NextRequest) {
  // Pré-visualização: sem banco não há sessão para checar.
  if (!isSupabaseConfigured) return NextResponse.next();

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

  // getUser valida o token no Supabase e renova a sessão quando preciso.
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
