"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Obra = {
  id: string;
  nombre: string;
  numero_obra: number | null;
  fotos_count: number;
};

export default function FotosObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObras = async () => {
      setLoading(true);

      // Traer obras y contar fotos
      const { data: obrasData, error: e1 } = await supabase
        .from("obra")
        .select("id, nombre, numero_obra")
        .order("numero_obra", { ascending: true });

      if (e1) {
        console.error("Error obras:", e1.message);
        setLoading(false);
        return;
      }

      const { data: fotosData, error: e2 } = await supabase
        .from("foto")
        .select("obra_id");

      if (e2) {
        console.error("Error fotos:", e2.message);
        setLoading(false);
        return;
      }

      const counts: Record<string, number> = {};
      (fotosData ?? []).forEach((f) => {
        counts[f.obra_id] = (counts[f.obra_id] || 0) + 1;
      });

      const merged = (obrasData ?? []).map((o) => ({
        ...o,
        fotos_count: counts[o.id] || 0,
      }));

      setObras(merged);
      setLoading(false);
    };

    fetchObras();
  }, []);

  if (loading) return <p className="p-6">Cargando...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Galería por Obra</h1>

      {obras.length === 0 ? (
        <p className="text-gray-500">No hay obras registradas.</p>
      ) : (
        <div className="bg-white rounded shadow p-4">
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">N° Obra</th>
                <th className="p-2 border text-left">Nombre</th>
                <th className="p-2 border text-center">Fotos</th>
              </tr>
            </thead>
            <tbody>
              {obras.map((o) => (
                <tr
                  key={o.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="p-2 border">{o.numero_obra ?? "-"}</td>
                  <td className="p-2 border">
                    <Link
                      href={`/fotos/${o.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {o.nombre}
                    </Link>
                  </td>
                  <td className="p-2 border text-center font-semibold">
                    {o.fotos_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
