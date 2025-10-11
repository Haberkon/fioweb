import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    // ✅ Obtener administradores de la tabla app_user_admin
    const { data: admins, error } = await supabaseAdmin
      .from("app_user_admin")
      .select("id, auth_user_id, nombre, apellido");

    if (error) throw error;
    if (!admins) return NextResponse.json([]);

    // ✅ Obtener lista de usuarios Auth
    const { data: authUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) throw authError;

    // ✅ Vincular email
    const enriched = admins.map((a) => {
      const found = authUsers.users.find((u) => u.id === a.auth_user_id);
      return { ...a, email: found?.email ?? "—", rol: "admin" };
    });

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error("Error cargando admins:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
