import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: Request) {
  try {
    const { auth_user_id, password } = await req.json();

    if (!auth_user_id || !password)
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      auth_user_id,
      { password }
    );

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("Error cambiando contraseña:", err);
    return NextResponse.json(
      { error: err.message ?? "Error desconocido" },
      { status: 500 }
    );
  }
}
