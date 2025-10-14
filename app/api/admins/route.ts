/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    // ✅ 1. Obtener administradores desde app_user_admin
    const { data: admins, error } = await supabaseAdmin
      .from("app_user_admin")
      .select("id, auth_user_id, nombre, apellido, email, rol");

    if (error) throw error;
    if (!admins) return NextResponse.json([]);

    // ✅ 2. Obtener usuarios Auth (para emparejar correo de login)
    const { data: authUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) throw authError;

    // ✅ 3. Unificar datos
    const enriched = admins.map((a) => {
      const found = authUsers.users.find((u) => u.id === a.auth_user_id);
      return {
        id: a.id,
        auth_user_id: a.auth_user_id,
        nombre: a.nombre,
        apellido: a.apellido,
        email: found?.email ?? "—", // correo auth
        correo_laboral: a.email ?? "", // correo laboral
        rol: a.rol ?? "admin", // rol del enum admin_role
      };
    });

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error("Error cargando admins:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
