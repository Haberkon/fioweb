import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // 🔹 Verificar sesión activa
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🔹 Buscar el usuario en app_user_admin
  const { data: admin } = await supabase
    .from("app_user_admin")
    .select("id, rol")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  // Si no existe en app_user_admin → fuera
  if (!admin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🔹 Control de acceso por rol
  const rol = admin.rol;

  // Superadmin y Admin → acceso total
  if (["superadmin", "admin"].includes(rol)) {
    return res;
  }

  // Cumplimiento → restringir secciones de gestión
  if (rol === "cumplimiento") {
    // Bloquear rutas que no correspondan a su rol
    const restrictedPaths = [
      "/admins",
      "/tecnicos",
      "/asignacionMateriales",
      "/asignacionObras",
      "/materiales",
    ];
    if (restrictedPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return res;
  }

  // Deposito → acceso solo a stock y home
  if (rol === "deposito") {
    const allowedPaths = ["/stock", "/home", "/perfil"];
    if (!allowedPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return res;
  }

  // Si no coincide con ningún rol conocido
  return NextResponse.redirect(new URL("/login", req.url));
}

// Protege todo excepto /login y assets estáticos
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|login).*)",
  ],
};