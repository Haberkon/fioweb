"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Plano = {
  id: string;
  nombre: string | null;
  storage_path: string;
  url?: string | null;
};

export default function PlanosPorObraPage() {
  const params = useParams();
  const obraId = Array.isArray(params.obraId) ? params.obraId[0] : params.obraId;

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!obraId) {
      console.warn("⚠️ obraId vacío en useParams:", params);
      return;
    }

    (async () => {
      setLoading(true);

      console.log("➡️ Buscando planos con obraId:", obraId);

      const { data: planosRaw, error } = await supabase
        .from("plano")
        .select("id,nombre,storage_path,obra_id,created_at")
        .eq("obra_id", obraId);

      if (error) {
        console.error("❌ Error cargando planos:", error.message);
        setPlanos([]);
      } else {
        console.log("📦 PlanosRaw desde Supabase:", planosRaw);

        const planosSigned = await Promise.all(
          (planosRaw ?? []).map(async (p) => {
            const { data } = await supabase.storage
              .from("planos")
              .createSignedUrl(p.storage_path, 600);

            console.log("🔗 Generando signedUrl para:", p.storage_path, "=>", data);

            return { ...p, url: data?.signedUrl ?? null };
          })
        );

        console.log("✅ Planos con signedUrl:", planosSigned);
        setPlanos(planosSigned);
      }

      setLoading(false);
    })();
  }, [obraId]);

  if (loading) return <p className="p-6">Cargando planos...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Planos de la obra</h1>

      {planos.length > 0 ? (
        <ul className="list-disc pl-6">
          {planos.map((p) => (
            <li key={p.id} className="mb-2">
              <span className="font-medium">
                {p.nombre ?? p.storage_path.split("/").pop()}
              </span>
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
                  Archivo no encontrado
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No hay planos para esta obra.</p>
      )}
    </div>
  );
}
