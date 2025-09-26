import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Verificar sesión
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verificar que sea admin
  const { data: admin } = await supabase
    .from("app_user_admin")
    .select("id")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

// Protege todo excepto /login y assets estáticos
export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
