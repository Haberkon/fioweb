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

  // Si no hay sesión → redirigir a login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🔹 Buscar usuario en app_user_admin
  const { data: admin } = await supabase
    .from("app_user_admin")
    .select("id, rol")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  // Si no existe → redirigir
  if (!admin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const rol = admin.rol;

  // Superadmin y Admin → acceso total
  if (["superadmin", "admin"].includes(rol)) return res;

  // Cumplimiento → restringir secciones de gestión
  if (rol === "cumplimiento") {
    const restrictedPaths = [
      "/admins",
      "/tecnicos",
      "/asignacionMateriales",
      "/consumo",
      "/asignacionObras",
      "/materiales",
    ];
    if (restrictedPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return res;
  }

  // Depósito → acceso permitido a varias secciones
if (rol === "deposito") {
  const allowedPaths = [
    "/home",
    "/obras",
    "/materiales",
    "/planos",
    "/fotos",
    "/asignacionObras",
    "/asignacionMateriales",
    "/asignarMateriales",
    "/consumo",
    "/registrarConsumo",
    "/stock",
    "/perfil",
  ];
  if (!allowedPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/home", req.url));
  }
  return res;
}


  // Si no coincide ningún rol conocido
  return NextResponse.redirect(new URL("/login", req.url));
}

// ✅ Protege todo excepto /login, assets estáticos y el endpoint de actualización de usuario
export const config = {
  matcher: [
    "/((?!api/users|_next/static|_next/image|favicon.ico|images|login).*)",
  ],
};
