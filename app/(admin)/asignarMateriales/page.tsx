/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Save, X, Search } from "lucide-react";

type Material = {
  id: string;
  codigo: string;
  descripcion: string | null;
  unidad: string | null;
};

export default function AsignarMaterialesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = searchParams.get("obraId") ?? null;

  const [materiales, setMateriales] = useState<Material[]>([]);
  const [filtered, setFiltered] = useState<Material[]>([]);
  const [asignados, setAsignados] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (obraId) cargarDatos();
  }, [obraId]);

  // 🔹 Cargar materiales y asignaciones actuales
  const cargarDatos = async () => {
    setLoading(true);

    const { data: mats, error: matsError } = await supabase
      .from("material")
      .select("id,codigo,descripcion,unidad")
      .order("codigo", { ascending: true });

    if (matsError) {
      console.error("Error cargando materiales:", matsError.message);
      setLoading(false);
      return;
    }

    const { data: asign, error: asignError } = await supabase
      .from("obra_material")
      .select("material_id,cantidad_planificada")
      .eq("obra_id", obraId);

    if (asignError) console.error("Error cargando asignaciones:", asignError.message);

    const asignMap: Record<string, number> = {};
    asign?.forEach((a) => {
      asignMap[a.material_id] = a.cantidad_planificada ?? 0;
    });

    setMateriales(mats ?? []);
    setFiltered(mats ?? []);
    setAsignados(asignMap);
    setLoading(false);
  };

  // 🔹 Búsqueda
  const handleSearch = (text: string) => {
    setSearch(text);
    const lower = text.toLowerCase();
    setFiltered(
      materiales.filter(
        (m) =>
          m.codigo.toLowerCase().includes(lower) ||
          (m.descripcion?.toLowerCase() ?? "").includes(lower)
      )
    );
  };

  // 🔹 Modificar cantidad
  const handleCantidad = (id: string, value: string) => {
    const num = value === "" ? 0 : parseInt(value);
    setAsignados((prev) => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
  };

  // 🔹 Guardar asignaciones
  const handleGuardar = async () => {
    if (!obraId) {
      alert("❌ No se encontró el ID de la obra.");
      return;
    }

    setSaving(true);

    const rows = Object.entries(asignados)
      .filter(([_, cantidad]) => cantidad > 0)
      .map(([material_id, cantidad]) => ({
        obra_id: obraId,
        material_id,
        cantidad_planificada: cantidad,
      }));

    console.log("🧱 Datos a insertar:", rows);

    try {
      // 1️⃣ Limpieza total
      const { error: delError } = await supabase
        .from("obra_material")
        .delete()
        .eq("obra_id", obraId);

      if (delError) throw new Error(`Error al eliminar anteriores: ${delError.message}`);

      // 2️⃣ Inserción
      if (rows.length > 0) {
        const { error: insError } = await supabase
          .from("obra_material")
          .insert(rows);

        if (insError) throw new Error(`Error al insertar nuevos: ${insError.message}`);
      }

      alert("✅ Materiales asignados correctamente.");
      router.push(`/obras/${obraId}`);
    } catch (err: any) {
      console.error("Error guardando materiales:", err.message);
      alert(`❌ Error guardando materiales: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 flex flex-col h-[calc(100vh-80px)] space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Asignar materiales a la obra
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            <X size={18} /> Cancelar
          </button>
          <button
            disabled={saving}
            onClick={handleGuardar}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={18} /> {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar material por código o descripción..."
          className="pl-9 border p-2 rounded-md w-full"
        />
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg shadow-sm">
        {loading ? (
          <p className="p-4 text-gray-500">Cargando materiales...</p>
        ) : (
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-100 sticky top-0 text-xs uppercase font-semibold">
              <tr>
                <th className="border p-2 text-left">Código</th>
                <th className="border p-2 text-left">Descripción</th>
                <th className="border p-2 text-center">Unidad</th>
                <th className="border p-2 text-center w-[160px]">
                  Cantidad planificada
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr
                  key={m.id}
                  className={`${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition`}
                >
                  <td className="border p-2">{m.codigo}</td>
                  <td className="border p-2">{m.descripcion}</td>
                  <td className="border p-2 text-center">{m.unidad}</td>
                  <td className="border p-2 text-center">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={asignados[m.id] ?? ""}
                      onChange={(e) => handleCantidad(m.id, e.target.value)}
                      className="border rounded p-1 w-24 text-center"
                    />
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
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;