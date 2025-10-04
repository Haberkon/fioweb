"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ObraDetallePage() {
  const { id } = useParams();
  const obraId = Array.isArray(id) ? id[0] : id;

  const [obra, setObra] = useState<any>(null);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [fotos, setFotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados popup técnicos
  const [showPopup, setShowPopup] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredTecnicos, setFilteredTecnicos] = useState<any[]>([]);
  const [selectedTecnicos, setSelectedTecnicos] = useState<string[]>([]);

  useEffect(() => {
    if (!obraId) return;

    (async () => {
      setLoading(true);

      /** Obra */
      const { data: obraData } = await supabase
        .from("obra")
        .select("*")
        .eq("id", obraId)
        .single();
      setObra(obraData);

      /** Materiales */
      const { data: om } = await supabase
        .from("obra_material")
        .select("*")
        .eq("obra_id", obraId);

      let mats: any[] = [];
      if (om && om.length > 0) {
        const { data: materialesData } = await supabase
          .from("material")
          .select("id,codigo,descripcion,unidad")
          .in("id", om.map((m) => m.material_id));

        mats = om.map((m) => ({
          ...m,
          material: materialesData?.find((mt) => mt.id === m.material_id) || null,
        }));
      }
      setMateriales(mats);

      /** Técnicos asignados */
      const { data: ot } = await supabase
        .from("obra_tecnico")
        .select("tecnico_id")
        .eq("obra_id", obraId);

      let tecs: any[] = [];
      if (ot && ot.length > 0) {
        const { data: usuarios } = await supabase
          .from("app_user")
          .select("id,nombre,apellido")
          .in("id", ot.map((t) => t.tecnico_id));
        tecs = usuarios ?? [];
      }
      setTecnicos(tecs);

      /** Planos */
      const { data: planosRaw, error } = await supabase
        .from("plano")
        .select("id, nombre, storage_path")
        .eq("obra_id", obraId);

      if (error) console.error("Error planos:", error.message);

      const planosSigned = await Promise.all(
        (planosRaw ?? []).map(async (p) => {
          const { data } = await supabase.storage
            .from("planos")
            .createSignedUrl(p.storage_path, 600);
          return {
            ...p,
            url: data?.signedUrl ?? null,
            fallback: p.storage_path.split("/").pop(),
          };
        })
      );

      setPlanos(planosSigned);

      /** Fotos */
      const { data: fotosRaw } = await supabase
        .from("foto")
        .select("id,categoria,storage_path")
        .eq("obra_id", obraId);

      const fotosSigned = await Promise.all(
        (fotosRaw ?? []).map(async (f) => {
          const { data } = await supabase.storage
            .from("fotos")
            .createSignedUrl(f.storage_path, 3600);
          return { ...f, url: data?.signedUrl ?? null };
        })
      );
      setFotos(fotosSigned);

      setLoading(false);
    })();
  }, [obraId]);

  /** Buscar técnicos */
  const handleSearchTecnico = async (text: string) => {
    setSearch(text);
    if (text.length > 1) {
      const { data, error } = await supabase
        .from("app_user")
        .select("id,nombre,apellido")
        .eq("rol", "tecnico")
        .or(`nombre.ilike.%${text}%,apellido.ilike.%${text}%`);

      if (!error) setFilteredTecnicos(data ?? []);
    } else {
      setFilteredTecnicos([]);
    }
  };

  /** Guardar técnicos asignados */
  const handleAsignarTecnicos = async () => {
    if (!obraId) return;

    await supabase.from("obra_tecnico").delete().eq("obra_id", obraId);

    const rows = selectedTecnicos.map((tid) => ({
      obra_id: obraId,
      tecnico_id: tid,
    }));
    if (rows.length > 0) await supabase.from("obra_tecnico").insert(rows);

    setShowPopup(false);

    // refrescar técnicos
    const { data: ot } = await supabase
      .from("obra_tecnico")
      .select("tecnico_id")
      .eq("obra_id", obraId);

    if (ot && ot.length > 0) {
      const { data: usuarios } = await supabase
        .from("app_user")
        .select("id,nombre,apellido")
        .in("id", ot.map((t) => t.tecnico_id));
      setTecnicos(usuarios ?? []);
    } else {
      setTecnicos([]);
    }
  };

  if (loading) return <p className="p-6">Cargando...</p>;
  if (!obra) return <p className="p-6 text-red-600">Obra no encontrada</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Info obra */}
      <h1 className="text-2xl font-bold">{obra.nombre}</h1>
      <div className="bg-white shadow rounded p-4 space-y-2">
        <p><strong>Cliente:</strong> {obra.cliente}</p>
        <p><strong>Estado:</strong> {obra.estado}</p>
        <p><strong>Creada:</strong> {obra.created_at?.substring(0, 10)}</p>
      </div>

      {/* Materiales */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Materiales asignados</h2>
        {materiales.length > 0 ? (
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Código</th>
                <th className="border p-2">Descripción</th>
                <th className="border p-2">Unidad</th>
                <th className="border p-2">Planificado</th>
                <th className="border p-2">Real</th>
              </tr>
            </thead>
            <tbody>
              {materiales.map((m) => (
                <tr key={m.id}>
                  <td className="border p-2">{m.material?.codigo}</td>
                  <td className="border p-2">{m.material?.descripcion}</td>
                  <td className="border p-2">{m.material?.unidad}</td>
                  <td className="border p-2">{m.cantidad_planificada ?? "-"}</td>
                  <td className="border p-2">{m.cantidad_real ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No hay materiales asignados.</p>
        )}
      </div>

      {/* Técnicos */}
      <div className="bg-white shadow rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Técnicos asignados</h2>
          <button
            onClick={() => {
              setSelectedTecnicos(tecnicos.map((t) => t.id)); // precargar
              setShowPopup(true);
            }}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border text-sm"
          >
            👷 Asignar técnicos
          </button>
        </div>

        {tecnicos.length > 0 ? (
          <ul className="list-disc pl-6">
            {tecnicos.map((t) => (
              <li key={t.id}>{t.nombre} {t.apellido}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No hay técnicos asignados.</p>
        )}
      </div>

      {/* Planos */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Planos</h2>
        {planos.length > 0 ? (
          <ul className="list-disc pl-6">
            {planos.map((p) => (
              <li key={p.id} className="mb-2">
                <span className="font-medium">{p.nombre ?? p.fallback}</span>
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    (ver PDF)
                  </a>
                ) : (
                  <span className="ml-2 text-red-500">
                    No se pudo generar link
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No hay planos asociados.</p>
        )}
      </div>

      {/* Fotos */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Fotos</h2>
        {fotos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fotos.map((f) => (
              <div key={f.id} className="border rounded overflow-hidden">
                {f.url && (
                  <img
                    src={f.url}
                    alt={f.categoria ?? "foto"}
                    className="w-full h-32 object-cover"
                  />
                )}
                <p className="text-center text-sm p-1">{f.categoria}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay fotos cargadas.</p>
        )}
      </div>

      {/* Popup asignación */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-200/40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[420px]">
            <h2 className="text-lg font-semibold mb-3">
              Asignar técnicos a {obra.nombre}
            </h2>

            {/* Input + resultados */}
            <div className="mb-3">
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchTecnico(e.target.value)}
                placeholder="Buscar técnico..."
                className="border p-2 w-full mb-2"
              />

              {search.length > 1 && filteredTecnicos.length > 0 && (
                <ul className="border rounded bg-white shadow max-h-40 overflow-y-auto">
                  {filteredTecnicos.map((t) => (
                    <li
                      key={t.id}
                      onClick={() => {
                        if (!selectedTecnicos.includes(t.id)) {
                          setSelectedTecnicos((prev) => [...prev, t.id]);
                        }
                        setSearch("");
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
                  const t =
                    filteredTecnicos.find((ft) => ft.id === id) ||
                    tecnicos.find((ot) => ot.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between border p-2 rounded"
                    >
                      <span>{t?.nombre} {t?.apellido}</span>
                      <button
                        onClick={() =>
                          setSelectedTecnicos((prev) =>
                            prev.filter((tid) => tid !== id)
                          )
                        }
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ❌
                      </button>
                    </div>
                  );
                })
              ) : (
                <span className="text-gray-400 text-sm">
                  Ningún técnico seleccionado
                </span>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowPopup(false)}
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
