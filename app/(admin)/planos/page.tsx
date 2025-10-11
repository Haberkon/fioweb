/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Obra = {
  id: string;
  nombre: string;
  estado: string | null;
  numero_obra: number | null;
  planos_count?: number;
};

export default function PlanosObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarObrasConPlanos();
  }, []);

  const cargarObrasConPlanos = async () => {
    setLoading(true);

    // 🧩 Consulta que trae las obras y cuenta los planos asociados
    const { data, error } = await supabase
      .from("obra")
      .select(`
        id,
        nombre,
        estado,
        numero_obra,
        plano ( id )
      `)
      .order("numero_obra", { ascending: true });

    if (error) {
      console.error("Error cargando obras:", error.message);
      setLoading(false);
      return;
    }

    // 📊 Contamos los planos de cada obra
    const obrasMap: Obra[] =
      (data ?? []).map((obra: any) => ({
        id: obra.id,
        nombre: obra.nombre,
        estado: obra.estado,
        numero_obra: obra.numero_obra,
        planos_count: obra.plano ? obra.plano.length : 0,
      }));

    setObras(obrasMap);
    setLoading(false);
  };

  if (loading) return <p className="p-6">Cargando obras...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Obras y Planos</h1>

      <table className="w-full border border-gray-300 bg-white text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border text-left">Obra Nº</th>
            <th className="p-2 border text-left">Nombre</th>
            <th className="p-2 border text-left">Estado</th>
            <th className="p-2 border text-left">Cant. Planos</th>
            <th className="p-2 border text-center">Ver Planos</th>
          </tr>
        </thead>
        <tbody>
          {obras.map((obra) => (
            <tr key={obra.id} className="hover:bg-gray-50">
              <td className="p-2 border font-medium">
                {obra.numero_obra ? `Nº ${obra.numero_obra}` : "—"}
              </td>
              <td className="p-2 border">{obra.nombre}</td>
              <td className="p-2 border capitalize">{obra.estado ?? "—"}</td>
              <td className="p-2 border text-center">
                {obra.planos_count ?? 0}
              </td>
              <td className="p-2 border text-center">
                <Link
                  href={`/planos/${obra.id}`}
                  className="text-blue-600 hover:underline"
                >
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
