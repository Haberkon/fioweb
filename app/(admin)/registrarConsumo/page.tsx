/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Save, X, Search } from "lucide-react";

type Obra = { id: string; nombre: string };
type Material = {
  id: string;
  codigo: string;
  descripcion: string | null;
  unidad: string | null;
};
type Tecnico = { id: string; nombre: string; apellido: string };

function RegistrarConsumoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = searchParams.get("obraId") ?? null;

  const [obra, setObra] = useState<Obra | null>(null);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [filtered, setFiltered] = useState<Material[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [tecnicoSel, setTecnicoSel] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [asignaciones, setAsignaciones] = useState<Record<string, number>>({}); // 🆕 asignaciones por material

  useEffect(() => {
    if (obraId) cargarDatos();
  }, [obraId]);

  const cargarDatos = async () => {
    setLoading(true);

    // 🔹 Datos de la obra
    const { data: obraData } = await supabase
      .from("obra")
      .select("id,nombre")
      .eq("id", obraId)
      .single();
    setObra(obraData ?? null);

    // 🔹 Todos los materiales
    const { data: mats } = await supabase
      .from("material")
      .select("id,codigo,descripcion,unidad")
      .order("codigo", { ascending: true });
    setMateriales(mats ?? []);
    setFiltered(mats ?? []);

    // 🔹 Técnicos
    const { data: tecs } = await supabase
      .from("app_user")
      .select("id,nombre,apellido")
      .eq("rol", "tecnico");
    setTecnicos(tecs ?? []);

    // 🔹 Asignaciones de la obra
    const { data: asignados, error: asignError } = await supabase
      .from("obra_material")
      .select("material_id, cantidad_planificada")
      .eq("obra_id", obraId);

    if (asignError) {
      console.error("Error cargando asignaciones:", asignError.message);
    } else {
      const asignMap: Record<string, number> = {};
      asignados?.forEach((a) => {
        asignMap[a.material_id] = a.cantidad_planificada ?? 0;
      });
      setAsignaciones(asignMap);
    }

    setLoading(false);
  };

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

  const handleCantidad = (id: string, value: string) => {
    const num = value === "" ? 0 : parseFloat(value);
    setCantidades((prev) => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
  };

  const handleGuardar = async () => {
    if (!obraId || !tecnicoSel) {
      alert("❌ Seleccione un técnico y asegúrese de tener una obra válida.");
      return;
    }

    const rows = Object.entries(cantidades)
      .filter(([_, cantidad]) => cantidad > 0)
      .map(([material_id, cantidad]) => ({
        obra_id: obraId,
        tecnico_id: tecnicoSel,
        material_id,
        cantidad,
        tomado_en: new Date().toISOString(),
        observacion: "Carga manual por administrador",
      }));

    if (rows.length === 0) {
      alert("⚠️ Ingrese al menos un consumo válido.");
      return;
    }

    // 🔍 Verificar si los materiales están asignados
    // 🔍 Verificar si los materiales están asignados
        const { data: asignados, error: asignError } = await supabase
          .from("obra_material")
          .select("material_id")
          .eq("obra_id", obraId);

        if (asignError) {
          console.error("Error verificando materiales asignados:", asignError.message);
          return;
        }

        const asignadosIds = (asignados ?? []).map((a) => a.material_id);
        const noAsignados = rows.filter(
          (r) => !asignadosIds.includes(r.material_id)
        );

        if (noAsignados.length > 0) {
          const nombresNoAsignados = noAsignados
            .map((r) => {
              const mat = materiales.find((m) => m.id === r.material_id);
              return mat ? `${mat.codigo} - ${mat.descripcion}` : r.material_id;
            })
            .join("\n");

          alert(
            `⚠️ Los siguientes materiales no están asignados a esta obra:\n\n${nombresNoAsignados}\n\nNo se puede registrar consumo hasta que sean asignados.`
          );
          return; // 🚫 Bloquea la inserción
        }

    setSaving(true);
    const { error } = await supabase.from("consumo").insert(rows);
    setSaving(false);

    if (error) {
      console.error("Error insertando consumos:", error.message);
      alert("❌ Error registrando consumos.");
    } else {
      alert("✅ Consumos registrados correctamente.");
      router.push("/consumo");
    }
  };

  return (
    <div className="p-8 flex flex-col h-[calc(100vh-80px)] space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Registrar consumo manual {obra ? `— ${obra.nombre}` : ""}
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

      {/* Técnico */}
      <div>
        <label className="block mb-2 text-sm font-semibold">
          Seleccionar técnico
        </label>
        <select
          value={tecnicoSel}
          onChange={(e) => setTecnicoSel(e.target.value)}
          className="border p-2 rounded-md w-full"
        >
          <option value="">-- Seleccione técnico --</option>
          {tecnicos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} {t.apellido}
            </option>
          ))}
        </select>
      </div>

      {/* Buscador materiales */}
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

      {/* Tabla materiales */}
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
              <th className="border p-2 text-center">Asignado</th>
              <th className="border p-2 text-center w-[160px]">Cantidad consumida</th>
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
                  <td className="border p-2 text-center text-gray-700">
                    {asignaciones[m.id] > 0 ? (
                      asignaciones[m.id]
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={cantidades[m.id] ?? ""}
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

export default function RegistrarConsumoPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <RegistrarConsumoInner />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
