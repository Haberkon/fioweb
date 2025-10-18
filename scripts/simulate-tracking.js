// scripts/simulate-tracking.js
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

// =========================================================
// 🔐 CONFIGURACIÓN
// =========================================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Faltan variables en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// =========================================================
// 🌍 DATOS BASE
// =========================================================

// 📍 Depósito (base Castelar)
const BASE = {
  nombre: "Depósito Castelar",
  lat: -34.657221,
  lng: -58.662317, // Eva Perón 3145, Castelar
};

// 📍 3 zonas principales
const ZONAS = [
  { nombre: "Palermo", lat: -34.583, lng: -58.425 },
  { nombre: "Caballito", lat: -34.618, lng: -58.442 },
  { nombre: "Flores", lat: -34.630, lng: -58.468 },
];

// 🔢 Parámetros
const INTERVAL_MS = 10000; // 10 s
const PASOS = 10; // total
const TABLA = "ubicacion_tecnico_test";

// =========================================================
// 🧩 FUNCIONES AUXILIARES
// =========================================================
function randomOffset(radio = 0.0025) {
  return (Math.random() - 0.5) * radio * 2; // ±radio
}

// =========================================================
// 🚀 FUNCIÓN PRINCIPAL
// =========================================================
async function simulateTracking() {
  console.log("🛰️ Iniciando simulación FIO (modo zonas + regreso directo)...");

  // 🔹 Obtener técnicos (solo 3)
  const { data: tecnicos, error } = await supabase
    .from("app_user")
    .select("id, nombre, apellido")
    .limit(3);

  if (error || !tecnicos?.length) {
    console.error("❌ No se pudieron obtener técnicos:", error?.message);
    return;
  }

  const tecnicosConZona = tecnicos.map((t, i) => ({
    ...t,
    zona: ZONAS[i],
  }));

  console.log(`✅ ${tecnicosConZona.length} técnicos asignados a zonas.`);

  // 🔹 Limpieza previa
  await supabase.from(TABLA).delete().neq("id", 0);
  console.log("🧹 Tabla de test limpiada.\n");

  let paso = 0;
  const interval = setInterval(async () => {
    paso++;
    console.log(`\n🧭 Paso ${paso}/${PASOS}`);

    for (const t of tecnicosConZona) {
      let lat, lng, ruta_activa = true;

      if (paso < PASOS - 1) {
        // Movimiento aleatorio dentro de la zona
        lat = t.zona.lat + randomOffset(0.003);
        lng = t.zona.lng + randomOffset(0.003);
      } else if (paso === PASOS - 1) {
        // Último punto antes de regresar
        lat = t.zona.lat + randomOffset(0.001);
        lng = t.zona.lng + randomOffset(0.001);
        console.log(`🏁 ${t.nombre} inicia regreso a base.`);
      } else {
        // Llegada directa a la base
        lat = BASE.lat;
        lng = BASE.lng;
        ruta_activa = false;
        console.log(`🏠 ${t.nombre} llegó a la base.`);
      }

      const { error: err } = await supabase.from(TABLA).insert({
        tecnico_id: t.id,
        lat,
        lng,
        velocidad: Math.round(Math.random() * 40) + 10,
        ruta_activa,
      });

      if (err)
        console.error(`❌ Error insertando ${t.nombre}:`, err.message);
      else
        console.log(`📍 ${t.nombre} ${t.apellido} → (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
    }

    // 🔚 Fin de simulación
    if (paso >= PASOS) {
      clearInterval(interval);
      console.log("\n✅ Simulación completa. Todos regresaron a base.");
      process.exit(0);
    }
  }, INTERVAL_MS);
}

// Ejecutar si se llama directamente
if (process.argv[1].includes("simulate-tracking.js")) simulateTracking();

export default simulateTracking;
