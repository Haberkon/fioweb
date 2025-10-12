"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type Obra = {
  id: string;
  numero_obra: number | null;
  nombre: string;
  cliente: string | null;
  estado: string | null;
  created_at: string | null;
};

export default function ConsumoObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<Obra[]>([]);

  useEffect(() => {
    cargarObras();
  }, []);

  const cargarObras = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("obra")
      .select("id, numero_obra, nombre, cliente, estado, created_at")
      .order("numero_obra", { ascending: true });

    if (error) {
      console.error("Error cargando obras:", error.message);
      setLoading(false);
      return;
    }

    setObras(data ?? []);
    setFiltered(data ?? []);
    setLoading(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const lower = text.toLowerCase();
    setFiltered(
      obras.filter(
        (o) =>
          String(o.numero_obra ?? "")
            .toLowerCase()
            .includes(lower) ||
          o.nombre.toLowerCase().includes(lower) ||
          (o.cliente?.toLowerCase() ?? "").includes(lower)
      )
    );
  };

  return (
    <div className="p-8 flex flex-col h-[calc(100vh-80px)] space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800">
          Registrar Consumo Manual
        </h1>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar obra por número, nombre o cliente..."
          className="border p-2 rounded-md w-full"
        />
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg shadow-sm">
        {loading ? (
          <p className="p-4 text-gray-500">Cargando obras...</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-gray-500">No se encontraron obras.</p>
        ) : (
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-100 sticky top-0 text-xs uppercase font-semibold">
              <tr>
                <th className="border p-2 text-center w-[100px]">N° Obra</th>
                <th className="border p-2 text-left">Nombre</th>
                <th className="border p-2 text-left">Cliente</th>
                <th className="border p-2 text-center">Estado</th>
                <th className="border p-2 text-center">Creada</th>
                <th className="border p-2 text-center w-[160px]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((obra, i) => (
                <tr
                  key={obra.id}
                  className={`${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition`}
                >
                  <td className="border p-2 text-center font-medium">
                    {obra.numero_obra ?? "-"}
                  </td>
                  <td className="border p-2 font-medium">{obra.nombre}</td>
                  <td className="border p-2">{obra.cliente ?? "-"}</td>
                  <td className="border p-2 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        obra.estado === "finalizada"
                          ? "bg-green-100 text-green-700"
                          : obra.estado === "en_curso"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {obra.estado ?? "-"}
                    </span>
                  </td>
                  <td className="border p-2 text-center">
                    {obra.created_at?.substring(0, 10) ?? "-"}
                  </td>
                  <td className="border p-2 text-center">
                    <Link
                      href={`/registrarConsumo?obraId=${obra.id}`}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      Registrar <ArrowRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
