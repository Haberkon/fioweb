"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ObraDetallePage() {
  const { id } = useParams();
  // ⚠️ Forzar id a string (puede venir como string[])
  const obraId = Array.isArray(id) ? id[0] : id;

  const [obra, setObra] = useState<any>(null);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [fotos, setFotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!obraId) return;

    (async () => {
      setLoading(true);

      /** 🔹 Obra */
      const { data: obraData } = await supabase
        .from("obra")
        .select("*")
        .eq("id", obraId)
        .single();
      setObra(obraData);

      /** 🔹 Materiales */
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

      /** 🔹 Técnicos */
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

      /** 🔹 Planos */
      const { data: planosRaw, error } = await supabase
        .from("plano")
        .select("id, nombre, storage_path")
        .eq("obra_id", obraId);

      if (error) console.error("Error planos:", error.message);

      const planosSigned = await Promise.all(
        (planosRaw ?? []).map(async (p) => {
          const { data } = await supabase.storage
            .from("planos")
            .createSignedUrl(p.storage_path, 600); // 10 min
          return {
            ...p,
            url: data?.signedUrl ?? null,
            fallback: p.storage_path.split("/").pop(), // por si no hay url
          };
        })
      );

      setPlanos(planosSigned);

      /** 🔹 Fotos */
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
        <h2 className="text-xl font-semibold mb-2">Técnicos asignados</h2>
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
    </div>
  );
}
