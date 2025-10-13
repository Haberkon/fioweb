"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function AccesoDenegadoPage() {
  const [rol, setRol] = useState<string | null>(null);

  useEffect(() => {
    const fetchRol = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data } = await supabase
        .from("app_user_admin")
        .select("rol")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (data?.rol) setRol(data.rol);
    };
    fetchRol();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full">
        <ShieldExclamationIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Acceso denegado
        </h1>
        <p className="text-gray-600 mb-2">
          No tenés permisos para acceder a esta sección.
        </p>
        {rol && (
          <p className="text-gray-500 text-sm mb-6">
            Estás logueado como{" "}
            <span className="font-semibold text-gray-700">{rol}</span>.
          </p>
        )}
        <Link
          href="/home"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
