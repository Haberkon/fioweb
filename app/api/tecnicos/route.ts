import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 usa la service key (solo en servidor)
);

export async function GET() {
  try {
    // 1️⃣ Traer técnicos desde app_user
    const { data: tecnicos, error: error1 } = await supabaseAdmin
      .from("app_user")
      .select("id, auth_user_id, nombre, apellido, dni, rol")
      .eq("rol", "tecnico");

    if (error1) throw error1;

    // 2️⃣ Traer todos los usuarios Auth
    const { data: users, error: error2 } = await supabaseAdmin.auth.admin.listUsers();
    if (error2) throw error2;

    // 3️⃣ Mapear emails
    const emailMap = new Map<string, string>();
    users.users.forEach((u) => {
      emailMap.set(u.id, u.email ?? "");
    });

    // 4️⃣ Unir datos
    const result = tecnicos.map((t) => ({
      ...t,
      email: emailMap.get(t.auth_user_id ?? "") ?? "",
    }));

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error en /api/tecnicos:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
