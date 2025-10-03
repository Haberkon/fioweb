"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Obra = {
  id: string;
  nombre: string;
  cliente: string | null;
  estado: string | null;
  fecha_ingreso?: string | null;
  created_at?: string | null;
};

type Tecnico = {
  id: string;
  nombre: string;
  apellido: string;
};

const estados = ["planificada", "en_progreso", "finalizada"];

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editedObras, setEditedObras] = useState<Record<string, Partial<Obra>>>({});
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [obraSeleccionada, setObraSeleccionada] = useState<Obra | null>(null);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [filteredTecnicos, setFilteredTecnicos] = useState<Tecnico[]>([]);
  const [selectedTecnicos, setSelectedTecnicos] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarObras();
    cargarTecnicos();
  }, []);

  const cargarObras = async () => {
    const { data, error } = await supabase.from("obra").select("*").order("created_at", { ascending: false });
    if (error) console.error("Error obras:", error.message);
    setObras(data ?? []);
  };

  const cargarTecnicos = async () => {
    const { data, error } = await supabase.from("app_user").select("id,nombre,apellido").eq("rol", "tecnico");
    if (error) console.error("Error técnicos:", error.message);
    setTecnicos(data ?? []);
    setFilteredTecnicos(data ?? []);
  };

  const handleSearchTecnico = (text: string) => {
    setSearch(text);
    const lower = text.toLowerCase();
    setFilteredTecnicos(
      tecnicos.filter((t) =>
        `${t.nombre} ${t.apellido}`.toLowerCase().includes(lower)
      )
    );
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

  const handleCreateObra = async (form: any) => {
    await supabase.from("obra").insert(form);
    setShowCreatePopup(false);
    cargarObras();
  };

  const abrirAsignarTecnicos = async (obra: Obra) => {
    setObraSeleccionada(obra);

    // Buscar técnicos ya asignados
    const { data: asignados } = await supabase
      .from("obra_tecnico")
      .select("tecnico_id")
      .eq("obra_id", obra.id);

    setSelectedTecnicos(asignados?.map((a) => a.tecnico_id) ?? []);
  };

  const handleAsignarTecnicos = async () => {
    if (!obraSeleccionada) return;

    await supabase.from("obra_tecnico").delete().eq("obra_id", obraSeleccionada.id);

    const rows = selectedTecnicos.map((tecnicoId) => ({
      obra_id: obraSeleccionada.id,
      tecnico_id: tecnicoId,
    }));
    if (rows.length > 0) await supabase.from("obra_tecnico").insert(rows);

    setObraSeleccionada(null);
    setSelectedTecnicos([]);
  };

  return (
    <div className="p-6 relative">
      {/* Botones superiores */}
      <div className="flex justify-end gap-3 mb-4">
        {!editMode ? (
          <>
            <button
              onClick={() => setShowCreatePopup(true)}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 border"
            >
              ➕ Crear obra
            </button>
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 border"
            >
              ✏️ Editar obras
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setEditMode(false);
                setEditedObras({});
              }}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 border"
            >
              ❌ Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
              💾 Guardar
            </button>
          </>
        )}
      </div>

      {/* Tabla de obras */}
      <table className="w-full border border-gray-300 bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Cliente</th>
            <th className="p-2 border">Estado</th>
            <th className="p-2 border">Ingreso</th>
            <th className="p-2 border">Técnicos</th>
            <th className="p-2 border">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {obras.map((obra) => (
            <tr key={obra.id}>
              <td className="p-2 border">
                {editMode ? (
                  <input
                    value={editedObras[obra.id]?.nombre ?? obra.nombre}
                    onChange={(e) => handleChange(obra.id, "nombre", e.target.value)}
                    className="border p-1 w-full"
                  />
                ) : (
                  obra.nombre
                )}
              </td>
              <td className="p-2 border">
                {editMode ? (
                  <input
                    value={editedObras[obra.id]?.cliente ?? obra.cliente ?? ""}
                    onChange={(e) => handleChange(obra.id, "cliente", e.target.value)}
                    className="border p-1 w-full"
                  />
                ) : (
                  obra.cliente
                )}
              </td>
              <td className="p-2 border">
                {editMode ? (
                  <select
                    value={editedObras[obra.id]?.estado ?? obra.estado ?? ""}
                    onChange={(e) => handleChange(obra.id, "estado", e.target.value)}
                    className="border p-1 w-full"
                  >
                    {estados.map((est) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                  </select>
                ) : (
                  obra.estado
                )}
              </td>
              <td className="p-2 border">
                {obra.fecha_ingreso ?? obra.created_at?.substring(0, 10)}
              </td>
              <td className="p-2 border text-center">
                <button
                  onClick={() => abrirAsignarTecnicos(obra)}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border text-sm"
                >
                  👷
                </button>
              </td>
              <td className="p-2 border text-center">
                <Link href={`/obras/${obra.id}`} className="text-blue-600 hover:underline">
                  ➡️
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Popup Crear Obra */}
      {showCreatePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Crear nueva obra</h2>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = Object.fromEntries(new FormData(e.currentTarget));
                await handleCreateObra(form);
              }}
            >
              <input name="nombre" placeholder="Nombre" className="border p-2 w-full" required />
              <input name="cliente" placeholder="Cliente" className="border p-2 w-full" />
              <select name="estado" className="border p-2 w-full">
                {estados.map((est) => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
              <input name="fecha_ingreso" type="date" className="border p-2 w-full" />

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreatePopup(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup Asignar Técnicos */}
      {obraSeleccionada && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-3">
              Asignar técnicos a {obraSeleccionada.nombre}
            </h2>

            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchTecnico(e.target.value)}
              placeholder="Buscar técnico..."
              className="border p-2 w-full mb-3"
            />

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredTecnicos.map((t) => (
                <label key={t.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTecnicos.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTecnicos((prev) => [...prev, t.id]);
                      } else {
                        setSelectedTecnicos((prev) =>
                          prev.filter((id) => id !== t.id)
                        );
                      }
                    }}
                  />
                  {t.nombre} {t.apellido}
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setObraSeleccionada(null)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleAsignarTecnicos}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
