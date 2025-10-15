/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { saveAs } from "file-saver";

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

export default function FotosObraDetalle() {
  const { id } = useParams();
  const obraId = Array.isArray(id) ? id[0] : id;

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [selectedFoto, setSelectedFoto] = useState<Foto | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [direccion, setDireccion] = useState<string>("");

  // 🔹 Cargar fotos
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

  // 🔹 Dirección y técnico
  useEffect(() => {
    const fetchExtra = async () => {
      if (!selectedFoto) return;

      // Dirección
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

      // Técnico
      if (selectedFoto.tecnico_id) {
        const { data: tecnicoData } = await supabase
          .from("app_user")
          .select("nombre, apellido")
          .eq("id", selectedFoto.tecnico_id)
          .maybeSingle();

        if (tecnicoData) {
          setSelectedFoto((prev) =>
            prev
              ? {
                  ...prev,
                  tecnico: `${tecnicoData.nombre} ${tecnicoData.apellido}`,
                }
              : prev
          );
        } else {
          setSelectedFoto((prev) =>
            prev ? { ...prev, tecnico: "N/D" } : prev
          );
        }
      }
    };

    fetchExtra();
  }, [selectedFoto]);

  // 🔹 Carrusel
  const handlePrev = () => {
    if (selectedIndex === null) return;
    const prev = (selectedIndex - 1 + fotos.length) % fotos.length;
    setSelectedIndex(prev);
    setSelectedFoto(fotos[prev]);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    const next = (selectedIndex + 1) % fotos.length;
    setSelectedIndex(next);
    setSelectedFoto(fotos[next]);
  };

  // 🔹 Navegación con teclado
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selectedFoto) return;
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") setSelectedFoto(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedFoto, selectedIndex]);

  // 🔹 Descarga con datos (Canvas)
  const handleDescargarConDatos = async (foto: Foto) => {
    if (!foto.url) return;

    try {
      const response = await fetch(foto.url);
      const imgBlob = await response.blob();
      const img = await createImageBitmap(imgBlob);

      // Crear canvas con espacio adicional para los datos
      const extra = 300;
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height + extra;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      // Banner negro
      const bannerHeight = 280;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, img.height - bannerHeight, img.width, bannerHeight);

      // Texto blanco
      ctx.fillStyle = "white";
      ctx.font = "bold 48px sans-serif";
      const baseY = img.height - bannerHeight + 100;
      const line = 55;

      ctx.fillText(`Nombre: ${foto.nombre ?? "-"}`, 60, baseY);
      ctx.fillText(`Categoría: ${foto.categoria ?? "-"}`, 60, baseY + line);
      ctx.fillText(
        `Fecha: ${
          foto.tomado_en
            ? new Date(foto.tomado_en).toLocaleString("es-AR")
            : "-"
        }`,
        60,
        baseY + line * 2
      );
      ctx.fillText(
        `Ubicación: ${
          foto.lat && foto.lon
            ? `${foto.lat.toFixed(6)}, ${foto.lon.toFixed(6)}`
            : "Sin datos"
        }`,
        60,
        baseY + line * 3
      );

      // Exportar y descargar
      const blobFinal = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), "image/jpeg", 0.9)
      );
      saveAs(blobFinal, `${foto.nombre ?? foto.id}_con_datos.jpg`);
    } catch (e) {
      console.error("Error al generar imagen con datos:", e);
    }
  };

  if (loading) return <p className="p-6">Cargando fotos...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Fotos de la obra</h1>
      <button
        onClick={() => (window.location.href = "/fotos")}
        className="text-blue-600 hover:text-blue-800 mb-6 text-base font-medium bg-blue-50 px-4 py-2 rounded-lg shadow-sm hover:bg-blue-100 transition"
      >
        ← Volver a galería
      </button>

      {fotos.length === 0 ? (
        <p className="text-gray-500">No hay fotos cargadas.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fotos.map((f, index) => (
            <div
              key={f.id}
              onClick={() => {
                setSelectedFoto(f);
                setSelectedIndex(index);
              }}
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

      {/* 🔹 Modal con carrusel y descarga */}
      {selectedFoto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="relative flex items-center justify-center max-w-4xl w-full">
            {/* Flecha anterior */}
            <button
              onClick={handlePrev}
              className="absolute left-6 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-black/50 text-white text-2xl hover:bg-black/70 transition"
            >
              ‹
            </button>

            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden relative">
              <div className="relative bg-gray-100 flex justify-center items-center">
                {selectedFoto.url && (
                  <Image
                    src={selectedFoto.url}
                    alt={selectedFoto.categoria ?? "Foto"}
                    width={800}
                    height={500}
                    className="w-full max-h-[480px] object-contain bg-gray-50"
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
                <p>
                  <strong>Nombre:</strong>{" "}
                  {selectedFoto.nombre ??
                    selectedFoto.storage_path.split("/").pop() ??
                    "Sin nombre"}
                </p>
                <p>
                  <strong>Categoría:</strong>{" "}
                  {selectedFoto.categoria ?? "Sin categoría"}
                </p>
                <p>
                  <strong>Fecha y hora:</strong>{" "}
                  {selectedFoto.tomado_en
                    ? new Date(selectedFoto.tomado_en).toLocaleString("es-AR")
                    : "-"}
                </p>
                <p className="truncate">
                  <strong>Ubicación:</strong>{" "}
                  {direccion
                    ? direccion.split(",").slice(0, 3).join(",")
                    : "No disponible"}
                </p>
                <p>
                  <strong>Técnico:</strong>{" "}
                  {selectedFoto.tecnico ?? "Desconocido"}
                </p>
              </div>

              {/* Botón descarga */}
              <button
                onClick={() => handleDescargarConDatos(selectedFoto)}
                className="absolute bottom-4 right-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 shadow-md"
              >
                ☁️ Descargar
              </button>
            </div>

            {/* Flecha siguiente */}
            <button
              onClick={handleNext}
              className="absolute right-6 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-black/50 text-white text-2xl hover:bg-black/70 transition"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
