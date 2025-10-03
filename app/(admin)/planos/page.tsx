"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Obra = {
  id: string;
  nombre: string;
  cliente: string | null;
  estado: string | null;
};

export default function PlanosObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("obra").select("id,nombre,cliente,estado");
      if (error) console.error("Error cargando obras:", error.message);
      setObras(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="p-6">Cargando obras...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Obras con planos</h1>

      <table className="w-full border border-gray-300 bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Cliente</th>
            <th className="p-2 border">Estado</th>
            <th className="p-2 border">Ver planos</th>
          </tr>
        </thead>
        <tbody>
          {obras.map((obra) => (
            <tr key={obra.id}>
              <td className="p-2 border">{obra.nombre}</td>
              <td className="p-2 border">{obra.cliente}</td>
              <td className="p-2 border">{obra.estado}</td>
              <td className="p-2 border text-center">
                <Link href={`/planos/${obra.id}`} className="text-blue-600 hover:underline">
                  ➡️
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
