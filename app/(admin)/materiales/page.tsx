/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Edit3, Save, X, Trash2, Search } from "lucide-react";

type Material = {
  id: string;
  codigo: string;
  descripcion: string | null;
  unidad: string | null;
  abreviacion: string | null;
  activo: boolean;
};

export default function MaterialesPage() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [filtered, setFiltered] = useState<Material[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [edited, setEdited] = useState<Record<string, Partial<Material>>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 🔹 Cargar materiales
  useEffect(() => {
    cargarMateriales();
  }, []);

  const cargarMateriales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("material")
      .select("*")
      .order("codigo", { ascending: true });

    if (error) {
      console.error("Error cargando materiales:", error.message);
    } else {
      setMateriales(data ?? []);
      setFiltered(data ?? []);
    }
    setLoading(false);
  };

  // 🔹 Búsqueda por código o descripción
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

  // 🔹 Editar campos inline
  const handleChange = (id: string, field: keyof Material, value: any) => {
    setEdited((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  // 🔹 Guardar cambios en DB
  const handleSave = async () => {
    for (const [id, changes] of Object.entries(edited)) {
      await supabase.from("material").update(changes).eq("id", id);
    }
    setEditMode(false);
    setEdited({});
    cargarMateriales();
  };

  // 🔹 Eliminar material
  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este material?")) return;
    await supabase.from("material").delete().eq("id", id);
    cargarMateriales();
  };

  // ✅ Crear nuevo material (función upsert adaptada)
  const handleCreate = async (form: Record<string, FormDataEntryValue>) => {
    const nuevo = {
      p_codigo: (form.codigo as string)?.trim(),
      p_abreviacion: (form.abreviacion as string)?.trim() || null,
      p_descripcion: (form.descripcion as string)?.trim(),
      p_unidad: (form.unidad as string)?.trim() || null,
      p_activo: true,
    };

    if (!nuevo.p_codigo || !nuevo.p_descripcion) {
      alert("Código y descripción son obligatorios.");
      return;
    }

    const { error } = await supabase.rpc("upsert_material", nuevo);

    if (error) {
      console.error("Error al crear material:", error.message);
      alert("Error al crear material: " + error.message);
      return;
    }

    alert("✅ Material creado o actualizado correctamente.");
    setShowCreateModal(false);
    cargarMateriales();
  };

  return (
    <div className="p-8 flex flex-col h-[calc(100vh-80px)]">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Materiales</h1>

        <div className="flex gap-3">
          {!editMode ? (
            <>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <Plus size={18} /> Nuevo
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
                  setEdited({});
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

      {/* Buscador */}
      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por código o descripción..."
          className="pl-9 border p-2 rounded-md w-full"
        />
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto rounded-lg border border-gray-200 shadow-sm">
        {loading ? (
          <p className="p-4 text-gray-500">Cargando materiales...</p>
        ) : (
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-100 text-gray-800 uppercase text-xs font-semibold sticky top-0">
              <tr>
                <th className="p-2 border">Código</th>
                <th className="p-2 border">Descripción</th>
                <th className="p-2 border">Unidad</th>
                <th className="p-2 border">Abrev.</th>
                <th className="p-2 border">Activo</th>
                {editMode && <th className="p-2 border text-center">Eliminar</th>}
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
                  <td className={`p-2 border ${editMode ? "w-[120px]" : ""}`}>
                    {editMode ? (
                      <input
                        className="border p-1 rounded w-full text-center"
                        value={edited[m.id]?.codigo ?? m.codigo}
                        onChange={(e) => handleChange(m.id, "codigo", e.target.value)}
                      />
                    ) : (
                      <span className="font-medium">{m.codigo}</span>
                    )}
                  </td>

                  <td className={`p-2 border ${editMode ? "w-[45%]" : ""}`}>
                    {editMode ? (
                      <input
                        className="border p-1 rounded w-full"
                        value={edited[m.id]?.descripcion ?? m.descripcion ?? ""}
                        onChange={(e) => handleChange(m.id, "descripcion", e.target.value)}
                      />
                    ) : (
                      m.descripcion
                    )}
                  </td>

                  <td className={`p-2 border text-center ${editMode ? "w-[140px]" : ""}`}>
                    {editMode ? (
                      <input
                        className="border p-1 rounded w-full text-center"
                        value={edited[m.id]?.unidad ?? m.unidad ?? ""}
                        onChange={(e) => handleChange(m.id, "unidad", e.target.value)}
                      />
                    ) : (
                      m.unidad
                    )}
                  </td>

                  <td className={`p-2 border text-center ${editMode ? "w-[160px]" : ""}`}>
                    {editMode ? (
                      <input
                        className="border p-1 rounded w-full text-center"
                        value={edited[m.id]?.abreviacion ?? m.abreviacion ?? ""}
                        onChange={(e) => handleChange(m.id, "abreviacion", e.target.value)}
                      />
                    ) : (
                      m.abreviacion
                    )}
                  </td>

                  <td className={`p-2 border text-center ${editMode ? "w-[100px]" : ""}`}>
                    {editMode ? (
                      <input
                        type="checkbox"
                        checked={edited[m.id]?.activo ?? m.activo}
                        onChange={(e) => handleChange(m.id, "activo", e.target.checked)}
                      />
                    ) : m.activo ? (
                      <span className="text-green-600 font-semibold">✔</span>
                    ) : (
                      <span className="text-red-600 font-semibold">✘</span>
                    )}
                  </td>

                  {editMode && (
                    <td className="p-2 border text-center w-[80px]">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[420px] border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Registrar nuevo material
            </h2>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = Object.fromEntries(new FormData(e.currentTarget));
                await handleCreate(form);
              }}
            >
              <input name="codigo" placeholder="Código" className="border p-2 w-full rounded" required />
              <input name="abreviacion" placeholder="Abreviación (ej: ONT)" className="border p-2 w-full rounded" />
              <input name="descripcion" placeholder="Descripción" className="border p-2 w-full rounded" required />
              <input name="unidad" placeholder="Unidad (ej: unidad, metro...)" className="border p-2 w-full rounded" />

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
