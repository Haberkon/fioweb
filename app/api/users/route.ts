import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 🟢 Crear usuario
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, nombre, apellido, dni, rol } = body;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) throw error;

    const tabla = rol === "admin" ? "app_user_admin" : "app_user";
    const insertObj: any = {
      auth_user_id: data.user?.id,
      nombre,
      apellido,
    };
    if (dni) insertObj.dni = dni;
    if (rol === "tecnico") insertObj.rol = "tecnico";

    const { error: insertError } = await supabaseAdmin.from(tabla).insert(insertObj);
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, userId: data.user?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// 🔴 Eliminar usuario
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { auth_user_id, tabla, id } = body;

    await supabaseAdmin.auth.admin.deleteUser(auth_user_id);
    await supabaseAdmin.from(tabla).delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// 🟡 Actualizar contraseña
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { auth_user_id, password } = body;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(auth_user_id, { password });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
