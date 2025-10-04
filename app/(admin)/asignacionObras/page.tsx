"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// 🔹 Tipos de datos
type Obra = {
  id: string;
  nombre: string;
};

type Tecnico = {
  id: string;
  nombre: string;
  apellido: string;
};

type ObraTecnicoRow = {
  tecnico_id: string;
  app_user: { id: string; nombre: string; apellido: string }[];
};

export default function AsignacionObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(null);
  const [tecnicosAsignados, setTecnicosAsignados] = useState<Tecnico[]>([]);
  const [search, setSearch] = useState("");
  const [resultados, setResultados] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // =====================================================
  // 🔹 Cargar obras al iniciar
  // =====================================================
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("obra")
        .select("id, nombre")
        .order("nombre", { ascending: true });

      if (error) console.error("Error cargando obras:", error.message);
      setObras(data ?? []);
      setLoading(false);
    })();
  }, []);

  // =====================================================
  // 🔹 Cargar técnicos cuando cambia la obra seleccionada
  // =====================================================
  useEffect(() => {
    if (obraSeleccionada) cargarTecnicosAsignados(obraSeleccionada);
  }, [obraSeleccionada]);

  // =====================================================
  // 🧱 Cargar técnicos asignados a una obra
  // =====================================================
  const cargarTecnicosAsignados = async (obraId: string) => {
    const { data, error } = await supabase
      .from("obra_tecnico")
      .select(`
        tecnico_id,
        app_user (id, nombre, apellido)
      `)
      .eq("obra_id", obraId);

    if (error) {
      console.error("Error cargando técnicos:", error);
      setTecnicosAsignados([]);
      return;
    }

    // ✅ Tipado fuerte y seguro
    type ObraTecnicoRow = {
      tecnico_id: string;
      app_user: { id: string; nombre: string; apellido: string }[];
    };

    const tecnicos: Tecnico[] =
      ((data as unknown as ObraTecnicoRow[] | null)
        ?.flatMap((t) => t.app_user) // aplanamos arrays
        .filter((u): u is Tecnico => !!u && !!u.id)) ?? [];

    setTecnicosAsignados(tecnicos);
  };

  // =====================================================
  // 🔍 Buscar técnicos disponibles
  // =====================================================
  const buscarTecnicos = async (query: string) => {
    setSearch(query);
    if (!query) {
      setResultados([]);
      return;
    }

    const { data, error } = await supabase
      .from("app_user")
      .select("id, nombre, apellido, rol")
      .ilike("nombre", `%${query}%`);

    if (error) {
      console.error("Error buscando técnicos:", error);
      setResultados([]);
      return;
    }

    const tecnicos = (data ?? []).filter(
      (t) => t.rol && t.rol.toLowerCase().includes("tecnico")
    ) as Tecnico[];

    setResultados(tecnicos);
  };

  // =====================================================
  // ➕ Asignar técnico
  // =====================================================
  const asignarTecnico = async (tecnicoId: string) => {
    if (!obraSeleccionada) {
      setMensaje({ tipo: "error", texto: "Seleccioná una obra antes de asignar un técnico." });
      return;
    }

    const { error } = await supabase
      .from("obra_tecnico")
      .insert([{ obra_id: obraSeleccionada, tecnico_id: tecnicoId }]);

    if (error) {
      if (error.message.includes("duplicate key value")) {
        setMensaje({ tipo: "error", texto: "⚠️ Este técnico ya está asignado a esta obra." });
      } else {
        setMensaje({ tipo: "error", texto: "Error asignando técnico: " + error.message });
      }
      return;
    }

    setMensaje({ tipo: "ok", texto: "✅ Técnico asignado correctamente." });
    setSearch("");
    setResultados([]);
    await cargarTecnicosAsignados(obraSeleccionada);

    setTimeout(() => setMensaje(null), 3000);
  };

  // =====================================================
  // ➖ Desasignar técnico
  // =====================================================
  const desasignarTecnico = async (tecnicoId: string) => {
    if (!obraSeleccionada) return;

    const { error } = await supabase
      .from("obra_tecnico")
      .delete()
      .eq("obra_id", obraSeleccionada)
      .eq("tecnico_id", tecnicoId);

    if (error) {
      setMensaje({ tipo: "error", texto: "Error quitando técnico: " + error.message });
      return;
    }

    setMensaje({ tipo: "ok", texto: "🗑️ Técnico eliminado de la obra." });
    await cargarTecnicosAsignados(obraSeleccionada);
    setTimeout(() => setMensaje(null), 3000);
  };

  // =====================================================
  // RENDER
  // =====================================================
  if (loading) return <p className="p-6">Cargando obras...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Asignación de Obras</h1>

      {/* 🔔 Mensaje visual */}
      {mensaje && (
        <div
          className={`rounded-md p-3 text-sm ${
            mensaje.tipo === "ok"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* 🔹 Selector de obra */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Seleccionar Obra:
        </label>
        <select
          value={obraSeleccionada ?? ""}
          onChange={(e) => setObraSeleccionada(e.target.value || null)}
          className="border rounded p-2 w-full"
        >
          <option value="">-- Selecciona una obra --</option>
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* 🔹 Técnicos asignados */}
      {obraSeleccionada && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Técnicos asignados:</h2>
          {tecnicosAsignados.length === 0 ? (
            <p className="text-gray-500">No hay técnicos asignados aún.</p>
          ) : (
            <ul className="space-y-1">
              {tecnicosAsignados.map((t) => (
                <li
                  key={t.id}
                  className="flex justify-between items-center border-b pb-1"
                >
                  <span>
                    {t.nombre} {t.apellido}
                  </span>
                  <button
                    onClick={() => desasignarTecnico(t.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 🔹 Buscador de técnicos */}
      {obraSeleccionada && (
        <div className="border-t pt-4">
          <input
            type="text"
            placeholder="Buscar técnico..."
            value={search}
            onChange={(e) => buscarTecnicos(e.target.value)}
            className="border rounded p-2 w-full mb-2"
          />

          {resultados.length > 0 && (
            <ul className="border rounded-md max-h-48 overflow-y-auto">
              {resultados.map((r) => (
                <li
                  key={r.id}
                  className="p-2 hover:bg-gray-100 flex justify-between items-center"
                >
                  <span>
                    {r.nombre} {r.apellido}
                  </span>
                  <button
                    onClick={() => asignarTecnico(r.id)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Asignar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
