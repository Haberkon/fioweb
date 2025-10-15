/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type Obra = {
  id: string;
  nombre: string;
  numero_obra: number | null;
  fotos_count: number;
  fotos_hoy: number;
  fotos_ayer: number;
  ultima_captura: string | null;
};

export default function FotosObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [mensaje, setMensaje] = useState("Preparando descarga...");
  const cancelRef = useRef<boolean>(false);

  // 🔹 Obtener obras y conteos
  useEffect(() => {
    const fetchObras = async () => {
      setLoading(true);
      const { data: obrasData, error: e1 } = await supabase
        .from("obra")
        .select("id, nombre, numero_obra")
        .order("numero_obra", { ascending: true });

      if (e1) {
        console.error("Error obras:", e1.message);
        setLoading(false);
        return;
      }

      const { data: fotosData, error: e2 } = await supabase
        .from("foto")
        .select("obra_id, tomado_en");

      if (e2) {
        console.error("Error fotos:", e2.message);
        setLoading(false);
        return;
      }

      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);

      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0).getTime();
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).getTime();
      const inicioAyer = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 0, 0, 0).getTime();
      const finAyer = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 23, 59, 59).getTime();

      const counts: Record<string, { total: number; hoy: number; ayer: number; ultima: string | null }> = {};

      (fotosData ?? []).forEach((f) => {
        const obraId = f.obra_id;
        if (!obraId || !f.tomado_en) return;
        if (!counts[obraId]) counts[obraId] = { total: 0, hoy: 0, ayer: 0, ultima: null };

        const fecha = new Date(f.tomado_en).getTime();
        counts[obraId].total += 1;
        if (fecha >= inicioHoy && fecha <= finHoy) counts[obraId].hoy += 1;
        else if (fecha >= inicioAyer && fecha <= finAyer) counts[obraId].ayer += 1;

        if (!counts[obraId].ultima || f.tomado_en > counts[obraId].ultima)
          counts[obraId].ultima = f.tomado_en;
      });

      const merged = (obrasData ?? []).map((o) => ({
        ...o,
        fotos_count: counts[o.id]?.total || 0,
        fotos_hoy: counts[o.id]?.hoy || 0,
        fotos_ayer: counts[o.id]?.ayer || 0,
        ultima_captura: counts[o.id]?.ultima || null,
      }));

      setObras(merged);
      setLoading(false);
    };

    fetchObras();
  }, []);

  // 🔹 Descarga simple
  const handleDownload = async (obraId: string, tipo: "hoy" | "ayer" | "total") => {
    setDownloading(obraId + tipo);
    cancelRef.current = false;
    setShowModal(true);
    setProgress(0);
    setStatus("loading");
    setMensaje("Preparando descarga...");

    try {
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);

      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
      const inicioAyer = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 0, 0, 0);
      const finAyer = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 23, 59, 59);

      let query = supabase.from("foto").select("id, storage_path, tomado_en").eq("obra_id", obraId);
      if (tipo === "hoy") query = query.gte("tomado_en", inicioHoy.toISOString()).lte("tomado_en", finHoy.toISOString());
      if (tipo === "ayer") query = query.gte("tomado_en", inicioAyer.toISOString()).lte("tomado_en", finAyer.toISOString());

      const { data: fotos, error } = await query;
      if (error || !fotos?.length) {
        setMensaje("No hay fotos disponibles en este rango.");
        setStatus("error");
        setDownloading(null);
        return;
      }

      const zip = new JSZip();
      let processed = 0;
      for (const f of fotos) {
        if (cancelRef.current) throw new Error("cancelado");
        const { data } = await supabase.storage.from("fotos").createSignedUrl(f.storage_path, 3600);
        if (!data?.signedUrl) continue;

        const blob = await (await fetch(data.signedUrl)).blob();
        zip.file(f.storage_path.split("/").pop() || `${f.id}.jpg`, blob);

        processed++;
        setProgress(Math.min(100, Math.round((processed / fotos.length) * 100)));
        setMensaje(`Procesando ${processed} de ${fotos.length} fotos...`);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `Fotos_${tipo}_${obraId}.zip`);
      setStatus("success");
      setMensaje("✅ Descarga completada correctamente.");
    } catch (e) {
      setStatus("error");
      setMensaje("❌ Error al generar la descarga.");
    } finally {
      setDownloading(null);
    }
  };

  // 🔹 Descarga con datos (6 campos: nombre, categoría, fecha, ubicación, dirección, técnico)
const handleDownloadConGeo = async (obraId: string, tipo: "ayer" | "hoy" | "total") => {
  setShowModal(true);
  setProgress(0);
  setStatus("loading");
  setMensaje(`Generando imágenes con datos (${tipo})...`);

  try {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
    const inicioAyer = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 0, 0, 0);
    const finAyer = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 23, 59, 59);

    let query = supabase
      .from("foto")
      .select("id, storage_path, nombre, categoria, tomado_en, lat, lon, tecnico_id")
      .eq("obra_id", obraId);

    if (tipo === "hoy")
      query = query.gte("tomado_en", inicioHoy.toISOString()).lte("tomado_en", finHoy.toISOString());
    if (tipo === "ayer")
      query = query.gte("tomado_en", inicioAyer.toISOString()).lte("tomado_en", finAyer.toISOString());

    const { data: fotos } = await query;
    if (!fotos?.length) {
      setMensaje(`No hay fotos disponibles para ${tipo}.`);
      setStatus("error");
      return;
    }

    const zip = new JSZip();
    let i = 0;

    for (const f of fotos) {
      // URL firmada
      const { data } = await supabase.storage.from("fotos").createSignedUrl(f.storage_path, 3600);
      if (!data?.signedUrl) continue;

      // Dirección convertida
      let direccionCompleta = "";
      if (f.lat && f.lon) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${f.lat}&lon=${f.lon}`
          );
          const geo = await res.json();
          direccionCompleta = geo.display_name || "";
        } catch {
          direccionCompleta = "";
        }
      }

      // Técnico
      let tecnicoNombre = "";
      if (f.tecnico_id) {
        const { data: tData } = await supabase
          .from("app_user")
          .select("nombre, apellido")
          .eq("id", f.tecnico_id)
          .maybeSingle();
        tecnicoNombre = tData ? `${tData.nombre} ${tData.apellido}` : "Desconocido";
      }

      // Crear imagen con banner
const imgBlob = await fetch(data.signedUrl).then((r) => r.blob());
const img = await createImageBitmap(imgBlob);

const bannerHeight = 420; // altura visible del rectángulo negro
const canvas = document.createElement("canvas");
canvas.width = img.width;
canvas.height = img.height; // sin extra — evita doble franja
const ctx = canvas.getContext("2d");
if (!ctx) continue;

ctx.drawImage(img, 0, 0);

// Fondo negro translúcido
ctx.fillStyle = "rgba(0,0,0,0.6)";
ctx.fillRect(0, img.height - bannerHeight, img.width, bannerHeight);

// Texto blanco
ctx.fillStyle = "white";
ctx.font = "bold 70px sans-serif";
const baseY = img.height - bannerHeight + 90;
const line = 65;

ctx.fillText(`Nombre: ${f.nombre ?? "-"}`, 60, baseY);
ctx.fillText(`Categoría: ${f.categoria ?? "-"}`, 60, baseY + line);
ctx.fillText(
  `Fecha y hora: ${
    f.tomado_en ? new Date(f.tomado_en).toLocaleString("es-AR") : "-"
  }`,
  60,
  baseY + line * 2
);
ctx.fillText(
  `Ubicación: ${
    f.lat && f.lon ? `${f.lat.toFixed(6)}, ${f.lon.toFixed(6)}` : "Sin datos"
  }`,
  60,
  baseY + line * 3
);

const direccionCorta = direccionCompleta
  ? direccionCompleta.split(",").slice(0, 3).join(",")
  : "Sin dirección disponible";
ctx.fillText(`Dirección: ${direccionCorta}`, 60, baseY + line * 4);

ctx.fillText(`Técnico: ${tecnicoNombre || "Desconocido"}`, 60, baseY + line * 5);

      // Convertir a blob y agregar al ZIP
      const blobFinal = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), "image/jpeg", 0.9)
      );
      zip.file(f.storage_path.split("/").pop() || `${f.id}.jpg`, blobFinal);

      i++;
      setProgress(Math.round((i / fotos.length) * 100));
      setMensaje(`Procesando ${i} de ${fotos.length} fotos (${tipo})...`);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `FotosConDatos_${tipo}_${obraId}.zip`);
    setStatus("success");
    setMensaje(`✅ Descarga completa (${tipo})`);
  } catch (e) {
    console.error(e);
    setStatus("error");
    setMensaje("❌ Error al generar imágenes con datos.");
  } finally {
    setDownloading(null);
  }
};


  const handleCancel = () => {
    cancelRef.current = true;
    setShowModal(false);
    setDownloading(null);
    setProgress(0);
  };

  if (loading) return <p className="p-6">Cargando...</p>;

 return (
  <div className="p-6">
    <h1 className="text-2xl font-semibold mb-6 text-gray-800">Galería por Obra</h1>

    {obras.length === 0 ? (
      <p className="text-gray-500 text-sm">No hay obras registradas.</p>
    ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm text-gray-800">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-2 px-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">N° Obra</th>
                <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Última captura</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Ayer</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Hoy</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Desc. (Ayer)</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Desc. (Hoy)</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Desc. (Total)</th>
              </tr>
            </thead>
           <tbody>
  {obras.map((o, idx) => (
    <tr
      key={o.id}
      onClick={() => (window.location.href = `/fotos/${o.id}`)}
      className={`${idx % 2 === 0 ? "bg-white" : "bg-[#fafafa]"} hover:bg-blue-50/50 transition-colors duration-150 cursor-pointer`}
    >
      <td className="py-2 px-2 text-center text-gray-700">{o.numero_obra ?? "-"}</td>

      <td className="py-2 px-4 whitespace-nowrap">
        <Link
          href={`/fotos/${o.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {o.nombre}
        </Link>
      </td>

      <td className="py-2 px-4 text-center text-gray-600 leading-tight">
        {o.ultima_captura ? (
          <>
            <div>
              {new Date(o.ultima_captura).toLocaleDateString("es-AR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {new Date(o.ultima_captura).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
          </>
        ) : (
          "-"
        )}
      </td>

      <td className="py-2 px-4 text-center">{o.fotos_ayer}</td>
      <td className="py-2 px-4 text-center">{o.fotos_hoy}</td>
      <td className="py-2 px-4 text-center font-semibold">{o.fotos_count}</td>

      {["ayer", "hoy", "total"].map((tipo) => (
        <td key={tipo} className="py-2 px-4 text-center">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(o.id, tipo as "ayer" | "hoy" | "total");
              }}
              disabled={downloading === o.id + tipo}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 w-[120px] whitespace-nowrap ${
                downloading === o.id + tipo
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              Descarga simple
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadConGeo(o.id, tipo as "ayer" | "hoy" | "total");
              }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-all duration-200 w-[140px] whitespace-nowrap"
            >
              Descarga datos
            </button>
          </div>
        </td>
      ))}
    </tr>
  ))}
</tbody>

          </table>
        </div>
      </div>
    )}

    {/* Modal */}
    {showModal && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">
            {status === "loading" && "Procesando imágenes..."}
            {status === "success" && "Descarga completa"}
            {status === "error" && "Proceso detenido"}
          </h2>

          {status === "loading" && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
              <div
                className="bg-blue-500 h-2.5 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-3">{mensaje}</p>

          <button
            onClick={status === "loading" ? handleCancel : () => setShowModal(false)}
            className={`mt-2 px-5 py-2 rounded-full font-medium text-sm transition ${
              status === "success"
                ? "bg-green-600 text-white hover:bg-green-700"
                : status === "error"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-300 text-gray-800 hover:bg-gray-400"
            }`}
          >
            {status === "loading" ? "Cancelar" : "Cerrar"}
          </button>
        </div>
      </div>
    )}
  </div>
);
}
