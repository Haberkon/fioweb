"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Obra = {
  id: string;
  nombre: string;
  numero_obra: number | null;
  fotos_count: number;
  fotos_hoy: number;
  fotos_ayer: number;
  ultima_captura: string | null;
};

export default function FotosObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObras = async () => {
      setLoading(true);

      // 🔹 Traer obras
      const { data: obrasData, error: e1 } = await supabase
        .from("obra")
        .select("id, nombre, numero_obra")
        .order("numero_obra", { ascending: true });

      if (e1) {
        console.error("Error obras:", e1.message);
        setLoading(false);
        return;
      }

      // 🔹 Traer fotos (obra_id + tomado_en)
      const { data: fotosData, error: e2 } = await supabase
        .from("foto")
        .select("obra_id, tomado_en");

      if (e2) {
        console.error("Error fotos:", e2.message);
        setLoading(false);
        return;
      }

      // 🔹 Preparar fechas de referencia
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);

      const inicioHoy = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate(),
        0,
        0,
        0
      ).getTime();
      const finHoy = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate(),
        23,
        59,
        59
      ).getTime();

      const inicioAyer = new Date(
        ayer.getFullYear(),
        ayer.getMonth(),
        ayer.getDate(),
        0,
        0,
        0
      ).getTime();
      const finAyer = new Date(
        ayer.getFullYear(),
        ayer.getMonth(),
        ayer.getDate(),
        23,
        59,
        59
      ).getTime();

      // 🔹 Contadores por obra
      const counts: Record<
        string,
        { total: number; hoy: number; ayer: number; ultima: string | null }
      > = {};

      (fotosData ?? []).forEach((f) => {
        const obraId = f.obra_id;
        if (!obraId || !f.tomado_en) return;

        if (!counts[obraId]) {
          counts[obraId] = { total: 0, hoy: 0, ayer: 0, ultima: null };
        }

        const fecha = new Date(f.tomado_en).getTime();

        counts[obraId].total += 1;

        if (fecha >= inicioHoy && fecha <= finHoy) counts[obraId].hoy += 1;
        else if (fecha >= inicioAyer && fecha <= finAyer)
          counts[obraId].ayer += 1;

        // Última captura
        if (!counts[obraId].ultima || f.tomado_en > counts[obraId].ultima) {
          counts[obraId].ultima = f.tomado_en;
        }
      });

      // 🔹 Mezclar resultados
      const merged = (obrasData ?? []).map((o) => ({
        ...o,
        fotos_count: counts[o.id]?.total || 0,
        fotos_hoy: counts[o.id]?.hoy || 0,
        fotos_ayer: counts[o.id]?.ayer || 0,
        ultima_captura: counts[o.id]?.ultima || null,
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
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <table className="w-full border min-w-[800px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">N° Obra</th>
                <th className="p-2 border text-left">Nombre</th>
                <th className="p-2 border text-center w-[300px]">Última captura</th>
                <th className="p-2 border text-center">Ayer</th>
                <th className="p-2 border text-center">Hoy</th>
                <th className="p-2 border text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {obras.map((o) => (
                <tr
                  key={o.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="p-2 border text-center">{o.numero_obra ?? "-"}</td>
                  <td className="p-2 border">
                    <Link
                      href={`/fotos/${o.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {o.nombre}
                    </Link>
                  </td>
                  <td className="p-2 border text-center text-gray-700 w-[300px]">
                  {o.ultima_captura
                    ? new Date(o.ultima_captura).toLocaleString("es-AR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                        .replace(".", "") // quita punto de 'oct.'
                        .replace(",", "") // quita coma extra tras el día
                        .replace(/(\d{2}) (\w{3})/, "$1/$2") // 14 Oct -> 14/Oct
                        .replace(" ", " ") + " " // mantiene espacios normales
                    : "-"}
                </td>
                  <td className="p-2 border text-center">{o.fotos_ayer}</td>
                  <td className="p-2 border text-center">{o.fotos_hoy}</td>
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
