import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // 1. Sesión
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.log("❌ No hay sesión en middleware");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  console.log("✅ Sesión encontrada:", session.user.id);

  // 2. Buscar admin en app_user_admin
  const { data: admin, error } = await supabase
    .from("app_user_admin")
    .select("id")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("❌ Error consultando app_user_admin:", error.message);
  }

  if (!admin) {
    console.log("❌ Usuario no es admin:", session.user.id);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  console.log("✅ Admin confirmado:", admin.id);
  return res;
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
