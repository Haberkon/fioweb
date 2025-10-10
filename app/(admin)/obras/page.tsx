"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  Plus,
  Edit3,
  Save,
  X,
  Trash2,
  Eye,
} from "lucide-react"; // 🔹 Iconos modernos Lucide

type Tecnico = {
  id: string;
  nombre: string;
  apellido: string;
};

type Obra = {
  id: string;
  nombre: string;
  estado: string | null;
  numero_obra: number | null;
  fecha_ingreso?: string | null;
  created_at?: string | null;
  tecnicos?: Tecnico[];
};

type ObraRow = {
  id: string;
  nombre: string;
  estado: string | null;
  numero_obra: number | null;
  created_at: string | null;
  obra_tecnico: {
    tecnico_id: string;
    app_user: Tecnico | null;
  }[];
};

const estados = [
  "planificada",
  "a_ejecutar",
  "en_curso",
  "pausada",
  "finalizada",
  "cancelada",
];

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editedObras, setEditedObras] = useState<Record<string, Partial<Obra>>>({});
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [obraAEliminar, setObraAEliminar] = useState<Obra | null>(null);

  useEffect(() => {
    cargarObras();
  }, []);

  const cargarObras = async () => {
    const { data, error } = await supabase
      .from("obra")
      .select(`
        id, nombre, estado, numero_obra, created_at,
        obra_tecnico (
          tecnico_id,
          app_user (id, nombre, apellido)
        )
      `)
      .order("numero_obra", { ascending: true });

    if (error) {
      console.error("Error obras:", error.message);
      return;
    }

    const obrasMap: Obra[] = ((data as unknown) as ObraRow[] ?? []).map((o) => ({
      ...o,
      tecnicos: (o.obra_tecnico ?? [])
        .map((ot) => ot.app_user)
        .filter((u): u is Tecnico => u !== null),
    }));

    setObras(obrasMap);
  };

  const handleChange = (id: string, field: keyof Obra, value: string) => {
    setEditedObras((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async () => {
    for (const [id, changes] of Object.entries(editedObras)) {
      await supabase.from("obra").update(changes).eq("id", id);
    }
    setEditMode(false);
    setEditedObras({});
    cargarObras();
  };

  const handleCreateObra = async (form: Record<string, FormDataEntryValue>) => {
    const nuevaObra = {
      nombre: (form.nombre as string)?.trim(),
      numero_obra: form.numero_obra ? Number(form.numero_obra) : null,
      estado: (form.estado as string) || "planificada",
      fecha_ingreso: form.fecha_ingreso ? (form.fecha_ingreso as string) : null,
    };

    if (!nuevaObra.nombre) {
      alert("El nombre de la obra es obligatorio.");
      return;
    }

    const { error } = await supabase.from("obra").insert(nuevaObra);
    if (error) {
      console.error("Error al crear obra:", error.message);
      alert("Error al crear la obra: " + error.message);
      return;
    }

    setShowCreatePopup(false);
    cargarObras();
  };

  const handleEliminarObra = async () => {
    if (!obraAEliminar) return;
    try {
      await supabase.from("obra_tecnico").delete().eq("obra_id", obraAEliminar.id);
      await supabase.from("plano").delete().eq("obra_id", obraAEliminar.id);
      await supabase.from("foto").delete().eq("obra_id", obraAEliminar.id);
      await supabase.from("obra_material").delete().eq("obra_id", obraAEliminar.id);
      await supabase.from("obra").delete().eq("id", obraAEliminar.id);

      setObraAEliminar(null);
      cargarObras();
    } catch (err) {
      console.error("Error eliminando obra:", err);
      alert("Error eliminando obra");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Obras</h1>

        <div className="flex gap-3">
          {!editMode ? (
            <>
              <button
                onClick={() => setShowCreatePopup(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <Plus size={18} /> Nueva Obra
              </button>
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md border transition"
              >
                <Edit3 size={18} /> Editar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditedObras({});
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md border transition"
              >
                <X size={18} /> Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                <Save size={18} /> Guardar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-800 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-2 text-left">Obra Nº</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Ingreso</th>
              <th className="px-4 py-2 text-left">Técnicos</th>
              <th className="px-4 py-2 text-center">Detalle</th>
              {editMode && (
                <th className="px-4 py-2 text-center text-red-600">Eliminar</th>
              )}
            </tr>
          </thead>
          <tbody>
            {obras.map((obra, i) => (
              <tr
                key={obra.id}
                className={`${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 transition`}
              >
                <td className="px-4 py-2 font-medium">
                  {obra.numero_obra ? `Nº ${obra.numero_obra}` : "—"}
                </td>
                <td className="px-4 py-2">
                  {editMode ? (
                    <input
                      value={editedObras[obra.id]?.nombre ?? obra.nombre}
                      onChange={(e) =>
                        handleChange(obra.id, "nombre", e.target.value)
                      }
                      className="border rounded-md p-1 w-full"
                    />
                  ) : (
                    obra.nombre
                  )}
                </td>
                <td className="px-4 py-2">
                  {editMode ? (
                    <select
                      value={editedObras[obra.id]?.estado ?? obra.estado ?? ""}
                      onChange={(e) =>
                        handleChange(obra.id, "estado", e.target.value)
                      }
                      className="border rounded-md p-1 w-full"
                    >
                      {estados.map((est) => (
                        <option key={est} value={est}>
                          {est.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="capitalize">{obra.estado ?? "—"}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {obra.fecha_ingreso ?? obra.created_at?.substring(0, 10)}
                </td>
                <td className="px-4 py-2">
                  {obra.tecnicos && obra.tecnicos.length > 0 ? (
                    <ul className="text-xs space-y-1">
                      {obra.tecnicos.map((t) => (
                        <li key={t.id}>• {t.nombre} {t.apellido}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400">Sin técnicos</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <Link
                    href={`/obras/${obra.id}`}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    <Eye size={18} />
                  </Link>
                </td>
                {editMode && (
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => setObraAEliminar(obra)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal eliminar */}
      {obraAEliminar && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[400px] border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 text-center">
              ¿Eliminar esta obra?
            </h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              Se eliminarán también los técnicos, fotos y planos asociados.
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => setObraAEliminar(null)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarObra}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear obra */}
      {showCreatePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-200/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Crear nueva obra</h2>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = Object.fromEntries(new FormData(e.currentTarget));
                await handleCreateObra(form);
              }}
            >
              <input
                name="nombre"
                placeholder="Nombre"
                className="border p-2 w-full rounded-md"
                required
              />
              <input
                name="numero_obra"
                type="number"
                placeholder="Número de obra (Ej: 1)"
                className="border p-2 w-full rounded-md"
              />
              <select
                name="estado"
                className="border p-2 w-full rounded-md"
              >
                {estados.map((est) => (
                  <option key={est} value={est}>
                    {est.replace("_", " ")}
                  </option>
                ))}
              </select>
              <input
                name="fecha_ingreso"
                type="date"
                className="border p-2 w-full rounded-md"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreatePopup(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
