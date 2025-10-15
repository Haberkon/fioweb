"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Foto = {
  id: string;
  nombre?: string | null;
  storage_path: string;
  categoria: string | null;
  tomado_en: string | null;
  lat: number | null;
  lon: number | null;
  tecnico_id?: string | null;
  url?: string | null;
  tecnico?: string | null;
};

export default function GaleriaObraDetalle() {
  const { id } = useParams();
  const obraId = Array.isArray(id) ? id[0] : id;

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [selectedFoto, setSelectedFoto] = useState<Foto | null>(null);
  const [loading, setLoading] = useState(true);
  const [direccion, setDireccion] = useState<string>("");

  useEffect(() => {
    if (!obraId) return;

    (async () => {
      setLoading(true);

      const { data: fotosRaw, error } = await supabase
        .from("foto")
        .select(
          "id, nombre, categoria, storage_path, tomado_en, lat, lon, tecnico_id"
        )
        .eq("obra_id", obraId)
        .order("tomado_en", { ascending: false });

      if (error) console.error("Error cargando fotos:", error.message);

      const fotosSigned: Foto[] = await Promise.all(
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

  // 🔹 obtener dirección y técnico
  useEffect(() => {
    const fetchExtra = async () => {
      if (!selectedFoto) return;

      // 🗺️ Dirección resumida
      if (selectedFoto.lat && selectedFoto.lon) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedFoto.lat}&lon=${selectedFoto.lon}`
          );
          const data = await res.json();
          setDireccion(data.display_name || "");
        } catch {
          setDireccion("");
        }
      } else {
        setDireccion("");
      }

      // 👷 Técnico (desde app_user)
      if (selectedFoto.tecnico_id) {
        const { data: tecnicoData, error: tecnicoError } = await supabase
          .from("app_user")
          .select("nombre, apellido")
          .eq("id", selectedFoto.tecnico_id)
          .maybeSingle();

        if (tecnicoError || !tecnicoData) {
          setSelectedFoto((prev) =>
            prev ? { ...prev, tecnico: "N/D" } : prev
          );
        } else {
          setSelectedFoto((prev) =>
            prev
              ? {
                  ...prev,
                  tecnico: `${tecnicoData.nombre} ${tecnicoData.apellido}`,
                }
              : prev
          );
        }
      }
    };

    fetchExtra();
  }, [selectedFoto]);

  if (loading) return <p className="p-6">Cargando fotos...</p>;

  return (
    <div className="p-6">
      <button
        onClick={() => (window.location.href = "/fotos")}
        className="text-gray-600 hover:text-gray-800 mb-4"
      >
        ← Volver a obras
      </button>

      <h1 className="text-2xl font-bold mb-4">Fotos de la obra</h1>

      {fotos.length === 0 ? (
        <p className="text-gray-500">No hay fotos cargadas.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fotos.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelectedFoto(f)}
              className="cursor-pointer border rounded overflow-hidden hover:shadow"
            >
              {f.url && (
                <img
                  src={f.url}
                  alt={f.categoria ?? "foto"}
                  className="w-full h-32 object-cover"
                />
              )}
              <p className="text-center text-sm p-1 truncate">
                {f.categoria ?? "Sin categoría"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 🔹 Modal detalle de foto */}
      {selectedFoto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="relative bg-gray-100">
              {selectedFoto.url && (
                <Image
                  src={selectedFoto.url}
                  alt={selectedFoto.categoria ?? "Foto"}
                  width={700}
                  height={400}
                  className="w-full max-h-[380px] object-contain bg-gray-50"
                />
              )}
              <button
                onClick={() => setSelectedFoto(null)}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-2 py-1 text-sm hover:bg-black/80 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 text-sm text-gray-700 space-y-1">
              {/* Nombre */}
              <p>
                <strong>Nombre:</strong>{" "}
                {selectedFoto.nombre ??
                  selectedFoto.storage_path.split("/").pop() ??
                  "Sin nombre"}
              </p>

              {/* Categoría */}
              <p>
                <strong>Categoría:</strong>{" "}
                {selectedFoto.categoria ?? "Sin categoría"}
              </p>

              {/* Fecha y hora */}
              <p>
                <strong>Fecha y hora:</strong>{" "}
                {selectedFoto.tomado_en
                  ? new Date(selectedFoto.tomado_en).toLocaleDateString(
                      "es-AR",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                      }
                    ) +
                    ", " +
                    new Date(selectedFoto.tomado_en).toLocaleTimeString(
                      "es-AR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }
                    )
                  : "-"}
              </p>

              {/* Ubicación resumida */}
              <p className="truncate">
                <strong>Ubicación:</strong>{" "}
                {direccion
                  ? direccion
                      .split(",")
                      .slice(0, 3)
                      .join(",") // calle + barrio + ciudad
                  : "No disponible"}
              </p>

              {/* Técnico */}
              <p>
                <strong>Técnico:</strong>{" "}
                {selectedFoto.tecnico ?? "Desconocido"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
