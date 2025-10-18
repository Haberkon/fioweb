import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =========================================================
// ⚙️ CONFIGURACIÓN DE SUPABASE
// =========================================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// =========================================================
// 📍 COORDENADAS BASE Y ZONAS
// =========================================================
const BASE = { lat: -34.657221, lng: -58.662317 }; // Eva Perón 3145, Castelar
const ZONAS = [
  { nombre: "Palermo", lat: -34.583, lng: -58.425 },
  { nombre: "Caballito", lat: -34.618, lng: -58.442 },
  { nombre: "Flores", lat: -34.630, lng: -58.468 },
];

// =========================================================
// 🚀 ENDPOINT POST
// =========================================================
export async function POST() {
  try {
    console.log("🛰️ Iniciando simulación express de tracking...");

    // 🔹 Obtener 3 técnicos
    const { data: tecnicos, error: errTec } = await supabase
      .from("app_user")
      .select("id, nombre, apellido")
      .limit(3);

    if (errTec) throw errTec;
    if (!tecnicos || tecnicos.length === 0)
      return NextResponse.json({ error: "No hay técnicos para simular" }, { status: 400 });

    // 🔹 Preparar filas a insertar
    const allRows: any[] = [];
    const now = new Date();

    for (const [i, t] of tecnicos.entries()) {
      const zona = ZONAS[i];
      let lat = zona.lat;
      let lng = zona.lng;

      // 8 movimientos rápidos dentro de la zona
      for (let j = 0; j < 8; j++) {
        lat += (Math.random() - 0.5) * 0.004;
        lng += (Math.random() - 0.5) * 0.004;

        const timestamp = new Date(now.getTime() + j * 2000).toISOString(); // simula cada 2 s
        allRows.push({
          tecnico_id: t.id,
          lat,
          lng,
          velocidad: Math.round(Math.random() * 40),
          ruta_activa: true,
          tomado_en: timestamp,
        });
      }

      // Último punto: llegada a la base
      const endTimestamp = new Date(now.getTime() + 16000).toISOString(); // tras 16 s
      allRows.push({
        tecnico_id: t.id,
        lat: BASE.lat,
        lng: BASE.lng,
        velocidad: 0,
        ruta_activa: false,
        tomado_en: endTimestamp,
      });
    }

    // 🔹 Limpiar tabla y reinsertar
    await supabase.from("ubicacion_tecnico_test").delete().neq("id", 0);
    const { error } = await supabase.from("ubicacion_tecnico_test").insert(allRows);
    if (error) throw error;

    console.log(`✅ Insertadas ${allRows.length} ubicaciones en simulación.`);
    return NextResponse.json({ ok: true, inserted: allRows.length });
  } catch (err: any) {
    console.error("❌ Error en simulación:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
