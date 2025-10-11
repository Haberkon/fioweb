"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminHome() {
  const [nombre, setNombre] = useState<string>("");

  useEffect(() => {
    const cargarNombre = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Buscar nombre del admin en app_user_admin
      const { data } = await supabase
        .from("app_user_admin")
        .select("nombre")
        .eq("auth_user_id", user.id)
        .single();

      setNombre(data?.nombre || user.email || "Usuario");
    };

    cargarNombre();
  }, []);

  // 🕒 Generar saludo según la hora actual
  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buen día" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="p-8 space-y-6">
      {/* Saludo principal */}
      <h1 className="text-3xl font-bold text-gray-800">
        👋 {saludo}, {nombre}!
      </h1>

      {/* Contenedor informativo */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-gray-600">
          Bienvenido al panel de administración de obras.
        </p>
        <p className="text-gray-500 mt-2">
          Desde el menú lateral podés acceder a las secciones de gestión:
          <br /> Obras, Materiales, Técnicos, Asignaciones y más.
        </p>
      </div>
    </div>
  );
}
