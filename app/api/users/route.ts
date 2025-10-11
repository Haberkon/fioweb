import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 🟢 Crear usuario (admin o técnico)
export async function POST(req: Request) {
  try {
    const { email, password, nombre, apellido, dni, rol } = await req.json();

    // 1️⃣ Crear usuario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) throw authError;

    const auth_user_id = authData.user?.id;
    if (!auth_user_id) throw new Error("No se pudo obtener el ID del usuario Auth");

    // 2️⃣ Insertar en tabla correspondiente
    const tabla = rol === "admin" ? "app_user_admin" : "app_user";
    const insertData: Record<string, any> = {
      auth_user_id,
      nombre,
      apellido,
    };

    if (dni) insertData.dni = dni;
    if (tabla === "app_user") insertData.rol = "tecnico";

    const { error: insertError } = await supabaseAdmin.from(tabla).insert(insertData);
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, userId: auth_user_id });
  } catch (err: any) {
    console.error("Error creando usuario:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// 🔴 Eliminar usuario
export async function DELETE(req: Request) {
  try {
    const { auth_user_id, tabla, id } = await req.json();

    // 1️⃣ Eliminar de Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(auth_user_id);
    if (authError) throw authError;

    // 2️⃣ Eliminar de DB
    const { error: dbError } = await supabaseAdmin.from(tabla).delete().eq("id", id);
    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error eliminando usuario:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// 🟡 Actualizar contraseña
export async function PATCH(req: Request) {
  try {
    const { auth_user_id, password } = await req.json();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(auth_user_id, { password });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error cambiando contraseña:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
