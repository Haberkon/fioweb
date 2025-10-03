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
  tecnicos?: Tecnico[];
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
  const [showAsignarPopup, setShowAsignarPopup] = useState(false);
  const [obraSeleccionada, setObraSeleccionada] = useState<Obra | null>(null);
  const [filteredTecnicos, setFilteredTecnicos] = useState<Tecnico[]>([]);
  const [selectedTecnicos, setSelectedTecnicos] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarObras();
  }, []);

  const cargarObras = async () => {
    const { data, error } = await supabase
      .from("obra")
      .select(`
        id, nombre, cliente, estado, created_at,
        obra_tecnico (
          tecnico_id,
          app_user (id, nombre, apellido)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) console.error("Error obras:", error.message);

    const obrasMap = (data ?? []).map((o: any) => ({
      ...o,
      tecnicos: (o.obra_tecnico ?? [])
        .map((ot: any) => ot.app_user)
        .filter((u: any) => u !== null), // ✅ filtramos nulos
    }));

    setObras(obrasMap);
  };

  const handleSearchTecnico = async (text: string) => {
    setSearch(text);

    if (text.length > 1) {
      const { data, error } = await supabase
        .from("app_user")
        .select("id,nombre,apellido")
        .eq("rol", "tecnico")
        .ilike("nombre", `%${text}%`);

      if (error) console.error("Error búsqueda técnicos:", error.message);
      setFilteredTecnicos(data ?? []);
    } else {
      setFilteredTecnicos([]);
    }
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
    setShowAsignarPopup(true);

    const { data: asignados, error } = await supabase
      .from("obra_tecnico")
      .select("tecnico_id")
      .eq("obra_id", obra.id);

    if (error) console.error("Error técnicos asignados:", error.message);

    setSelectedTecnicos(asignados?.map((a) => a.tecnico_id) ?? []);
  };

  const handleAsignarTecnicos = async () => {
    if (!obraSeleccionada) return;

    // limpiar asignaciones anteriores
    await supabase
      .from("obra_tecnico")
      .delete()
      .eq("obra_id", obraSeleccionada.id);

    // insertar nuevas asignaciones
    const rows = selectedTecnicos.map((tecnicoId) => ({
      obra_id: obraSeleccionada.id,
      tecnico_id: tecnicoId,
    }));
    if (rows.length > 0) {
      await supabase.from("obra_tecnico").insert(rows);
    }

    setShowAsignarPopup(false);
    setObraSeleccionada(null);
    setSelectedTecnicos([]);
    cargarObras();
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
              <td className="p-2 border">
                {obra.tecnicos && obra.tecnicos.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {obra.tecnicos.map((t) => (
                      <li key={t.id}>{t.nombre} {t.apellido}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-400">Sin técnicos</span>
                )}
                <button
                  onClick={() => abrirAsignarTecnicos(obra)}
                  className="mt-2 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border text-xs"
                >
                  👷 Asignar
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
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-20 z-50">
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

     {showAsignarPopup && obraSeleccionada && (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-20 z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-[420px] relative">
      <h2 className="text-lg font-semibold mb-3">
        Asignar técnicos a {obraSeleccionada.nombre}
      </h2>

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchTecnico(e.target.value)}
          placeholder="Buscar técnico..."
          className="border p-2 w-full mb-3"
        />

        {/* Dropdown resultados */}
        {search.length > 1 && filteredTecnicos.length > 0 && (
          <ul className="absolute left-0 right-0 bg-white border rounded shadow max-h-40 overflow-y-auto z-10">
            {filteredTecnicos.map((t) => (
              <li
                key={t.id}
                onClick={() => {
                  if (!selectedTecnicos.includes(t.id)) {
                    setSelectedTecnicos((prev) => [...prev, t.id]);
                  }
                  setSearch(""); // limpiar buscador
                  setFilteredTecnicos([]);
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {t.nombre} {t.apellido}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Técnicos seleccionados */}
      <div className="mt-3 space-y-1">
        {selectedTecnicos.length > 0 ? (
          selectedTecnicos.map((id) => {
            const t = filteredTecnicos.find((ft) => ft.id === id) ||
                      obraSeleccionada.tecnicos?.find((ot) => ot.id === id);
            return (
              <div key={id} className="flex items-center justify-between border p-2 rounded">
                <span>{t?.nombre} {t?.apellido}</span>
                <button
                  onClick={() =>
                    setSelectedTecnicos((prev) => prev.filter((tid) => tid !== id))
                  }
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ❌
                </button>
              </div>
            );
          })
        ) : (
          <span className="text-gray-400 text-sm">Ningún técnico seleccionado</span>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={() => setShowAsignarPopup(false)}
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
