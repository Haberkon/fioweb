/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    // 1️⃣ Obtener técnicos de la tabla app_user
    const { data: tecnicos, error } = await supabaseAdmin
      .from("app_user")
      .select("id, auth_user_id, nombre, apellido, dni, rol");

    if (error) throw error;
    if (!tecnicos) return NextResponse.json([]);

    // 2️⃣ Obtener lista de usuarios Auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // 3️⃣ Vincular email con cada técnico
    const enriched = tecnicos.map((t) => {
      const found = authUsers.users.find((u) => u.id === t.auth_user_id);
      return {
        ...t,
        email: found?.email ?? "—",
      };
    });

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error("Error cargando técnicos:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
