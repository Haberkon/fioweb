import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Verificar sesión activa
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si no hay sesión → redirigir a login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Validar existencia del usuario en app_user_admin
  const { data: admin } = await supabase
    .from("app_user_admin")
    .select("id, rol")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Si pasó validaciones → continuar
  return res;
}

// Protege todo excepto /login, estáticos y API públicas
export const config = {
  matcher: [
    "/((?!api/users|_next/static|_next/image|favicon.ico|images|login).*)",
  ],
};
